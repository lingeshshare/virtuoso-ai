import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { AnalyzeResponse } from '@/lib/audio/metrics-types'

type Params = { params: Promise<{ id: string }> }

const AUDIO_SERVICE_URL = process.env.AUDIO_ANALYSIS_SERVICE_URL ?? 'http://localhost:8000'
const AUDIO_SERVICE_KEY = process.env.AUDIO_SERVICE_API_KEY ?? ''

// POST /api/recordings/[id]/analyze
// Triggered after upload. Downloads audio → calls Python service → stores metrics → updates status.
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params

  // Auth: accept calls from the upload route (same process) or authenticated users.
  // Use the service client for the recording lookup so RLS doesn't block
  // fire-and-forget server→server calls that carry no session cookie.
  const svc = await createServiceClient()
  const { data: recording, error: recErr } = await svc
    .from('recordings')
    .select('id, user_id, file_path, instrument, status')
    .eq('id', id)
    .single()

  if (recErr || !recording) {
    return NextResponse.json({ error: 'Recording not found' }, { status: 404 })
  }

  // If the request comes from an authenticated browser session, verify ownership.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user && user.id !== recording.user_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!recording.file_path) {
    return NextResponse.json({ error: 'No file uploaded yet' }, { status: 400 })
  }

  // Mark as processing
  await svc
    .from('recordings')
    .update({ status: 'processing' })
    .eq('id', id)

  try {
    // Generate a fresh 10-minute signed URL for the Python service to download
    const { data: signedData, error: signErr } = await svc.storage
      .from('recordings')
      .createSignedUrl(recording.file_path, 600)

    if (signErr || !signedData?.signedUrl) {
      throw new Error(`Failed to generate signed URL: ${signErr?.message}`)
    }

    // Check if audio service is configured
    if (!process.env.AUDIO_ANALYSIS_SERVICE_URL) {
      throw new Error('AUDIO_ANALYSIS_SERVICE_URL not configured')
    }

    // Call the Python audio analysis service
    const audioServiceRes = await fetch(`${AUDIO_SERVICE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(AUDIO_SERVICE_KEY ? { 'x-api-key': AUDIO_SERVICE_KEY } : {}),
      },
      body: JSON.stringify({
        recording_id: id,
        audio_url: signedData.signedUrl,
        instrument: recording.instrument,
      }),
      signal: AbortSignal.timeout(300_000), // 5 min max
    })

    if (!audioServiceRes.ok) {
      const body = await audioServiceRes.text()
      throw new Error(`Audio service error ${audioServiceRes.status}: ${body}`)
    }

    const analysisResult: AnalyzeResponse = await audioServiceRes.json()
    const { metrics } = analysisResult

    if (metrics.error) {
      throw new Error(`Engine error: ${metrics.error}`)
    }

    // Store merged metrics in audio_metrics table
    const { error: metricsErr } = await svc.from('audio_metrics').insert({
      recording_id: id,
      engine: metrics.engine,              // 'multi-engine' | 'librosa' | etc.
      metrics_json: metrics as unknown as Record<string, unknown>,
      tempo_bpm: metrics.tempo.bpm,
      avg_loudness_db: metrics.dynamics.avg_db,
      onset_count: metrics.onsets.count,
      timing_score: metrics.scores['timing_score'] ?? null,
      dynamics_score: metrics.scores['dynamics_score'] ?? null,
      pitch_accuracy: metrics.scores['intonation_score'] ?? null,
      intonation_score: metrics.scores['intonation_score'] ?? null,
    })

    if (metricsErr) {
      throw new Error(`Failed to store metrics: ${metricsErr.message}`)
    }

    // Log which engines succeeded
    console.log(
      `[analyze] recording=${id} engines_succeeded=${analysisResult.engines_succeeded?.join(',') ?? metrics.engine}`
    )

    // Update recording: status → analyzed, duration from metrics
    await svc
      .from('recordings')
      .update({
        status: 'analyzed',
        duration_seconds: metrics.duration_seconds,
      })
      .eq('id', id)

    // Fire-and-forget: trigger Claude coaching with the default persona.
    // The client polls recording status; this returns immediately.
    if (process.env.ANTHROPIC_API_KEY) {
      const coachUrl = new URL(`/api/recordings/${id}/coach`, req.url)
      fetch(coachUrl.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona: 'clinician' }),
      }).catch((err) => console.error(`[analyze] Failed to trigger coaching for ${id}:`, err))
    }

    return NextResponse.json({
      success: true,
      recording_id: id,
      duration_seconds: metrics.duration_seconds,
      processing_time_s: analysisResult.processing_time_s,
      engine: metrics.engine,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)

    // Mark recording as error
    await svc
      .from('recordings')
      .update({ status: 'error', error_message: message })
      .eq('id', id)

    console.error(`[analyze] recording=${id} error:`, message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
