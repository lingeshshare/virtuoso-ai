import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { diagnose } from '@/lib/coaching/diagnosis'
import { generateFeedback, generatePracticePlan } from '@/lib/coaching/claude-engine'
import { getRubric, applyPersonaWeights } from '@/lib/constants/rubrics'
import { getPersonaById } from '@/lib/constants/personas'
import { getInstrumentById } from '@/lib/constants/instruments'
import type { StandardizedMetrics } from '@/lib/audio/metrics-types'
import type { CoachingPersona } from '@/lib/types'
import type { CoachingInput } from '@/lib/coaching/types'

type Params = { params: Promise<{ id: string }> }

const VALID_PERSONAS: CoachingPersona[] = [
  'clinician', 'all-state-judge', 'conservatory-professor', 'band-director', 'private-teacher',
]

// POST /api/recordings/[id]/coach
// Runs the full coaching pipeline: diagnosis → Claude feedback → Claude practice plan.
// Stores results in feedback_reports and practice_plans tables.
// Idempotent: if a report already exists for this persona, returns it without re-running.
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse persona from query or body
  const url = new URL(req.url)
  const bodyJson = await req.json().catch(() => ({}))
  const persona: CoachingPersona = (
    url.searchParams.get('persona') ?? bodyJson?.persona ?? 'clinician'
  ) as CoachingPersona

  if (!VALID_PERSONAS.includes(persona)) {
    return NextResponse.json({ error: `Invalid persona: ${persona}` }, { status: 400 })
  }

  // Fetch recording + audio metrics + reference materials
  const { data: rec, error: recErr } = await supabase
    .from('recordings')
    .select(`
      id, title, instrument, status, user_id,
      audio_metrics (engine, metrics_json),
      feedback_reports (id, persona, overall_score, estimated_level, summary, report_json),
      reference_materials (id, file_name, file_type, material_type)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (recErr || !rec) {
    return NextResponse.json({ error: 'Recording not found' }, { status: 404 })
  }

  if (rec.status !== 'analyzed') {
    return NextResponse.json(
      { error: `Recording status is "${rec.status}" — analysis must complete before coaching.` },
      { status: 400 }
    )
  }

  // Check if a report already exists for this persona
  const existingReports = Array.isArray(rec.feedback_reports) ? rec.feedback_reports : [rec.feedback_reports].filter(Boolean)
  const existingReport = existingReports.find((r: { persona: string }) => r?.persona === persona)
  if (existingReport) {
    return NextResponse.json({ report: existingReport, cached: true })
  }

  // Get audio metrics
  const metricsRow = Array.isArray(rec.audio_metrics) ? rec.audio_metrics[0] : rec.audio_metrics
  if (!metricsRow?.metrics_json) {
    return NextResponse.json({ error: 'No audio metrics found for this recording' }, { status: 400 })
  }

  const metrics = metricsRow.metrics_json as unknown as StandardizedMetrics

  // Build rubric for instrument + apply persona weights
  const baseRubric = getRubric(rec.instrument)
  if (!baseRubric || baseRubric.length === 0) {
    return NextResponse.json({ error: `No rubric defined for instrument: ${rec.instrument}` }, { status: 400 })
  }
  const personaDef = getPersonaById(persona)
  const adjustedRubric = personaDef ? applyPersonaWeights(baseRubric, personaDef) : baseRubric

  // Fetch user profile for level context
  const { data: profile } = await supabase
    .from('profiles')
    .select('current_level, target_level')
    .eq('id', user.id)
    .single()

  const currentLevel = profile?.current_level ?? 'intermediate'
  const targetLevel = profile?.target_level ?? null
  const instrumentDef = getInstrumentById(rec.instrument)
  const instrumentLabel = instrumentDef?.label ?? rec.instrument

  // Collect reference materials
  const refMaterials = Array.isArray(rec.reference_materials)
    ? rec.reference_materials
    : rec.reference_materials
    ? [rec.reference_materials]
    : []

  // Run diagnosis engine
  const diagnosis = diagnose(metrics)

  const coachingInput: CoachingInput = {
    recording_id: id,
    instrument: rec.instrument,
    instrument_label: instrumentLabel,
    current_level: currentLevel,
    target_level: targetLevel,
    persona,
    diagnosis,
    rubric: adjustedRubric.map((r) => ({
      id: r.id,
      name: r.name,
      weight: r.baseWeight,
      description: r.description,
    })),
    reference_materials: refMaterials.map((m: { file_name: string; file_type: string; material_type: string }) => ({
      file_name: m.file_name,
      file_type: m.file_type,
      material_type: m.material_type,
    })),
  }

  try {
    // Generate feedback report
    const { report, inputTokens, outputTokens } = await generateFeedback(coachingInput)

    // Store feedback_report
    const svc = await createServiceClient()
    const { data: storedReport, error: reportErr } = await svc
      .from('feedback_reports')
      .insert({
        recording_id: id,
        user_id: user.id,
        overall_score: report.overall_score,
        estimated_level: report.estimated_level,
        summary: report.summary,
        report_json: report as unknown as Record<string, unknown>,
        persona,
        claude_model: 'claude-sonnet-4-6',
        input_tokens: inputTokens,
        output_tokens: outputTokens,
      })
      .select()
      .single()

    if (reportErr) {
      console.error('[coach] Failed to store feedback_report:', reportErr)
      return NextResponse.json({ error: reportErr.message }, { status: 500 })
    }

    // Generate practice plan (second Claude call)
    const { plan, inputTokens: planIn, outputTokens: planOut } = await generatePracticePlan(
      report,
      instrumentLabel,
      currentLevel,
      persona
    )

    // Store practice_plan
    const totalMinutes = plan.total_minutes_per_day
    await svc.from('practice_plans').insert({
      recording_id: id,
      report_id: storedReport.id,
      user_id: user.id,
      drills_json: plan as unknown as Record<string, unknown>,
      total_minutes: totalMinutes,
    })

    console.log(
      `[coach] recording=${id} persona=${persona} feedback=${inputTokens}+${outputTokens}tok plan=${planIn}+${planOut}tok`
    )

    return NextResponse.json({ report: storedReport, plan, cached: false }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[coach] recording=${id}:`, message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// GET /api/recordings/[id]/coach — fetch existing reports for this recording
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('feedback_reports')
    .select('id, persona, overall_score, estimated_level, summary, report_json, created_at')
    .eq('recording_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reports: data ?? [] })
}
