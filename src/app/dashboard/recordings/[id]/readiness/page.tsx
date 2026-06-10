import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Target, TrendingUp, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react'
import { Topbar } from '@/components/layout/topbar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'
import { getRubric } from '@/lib/constants/rubrics'
import { getLevelById, PERFORMANCE_LEVELS } from '@/lib/constants/levels'
import { computeGapAnalysis } from '@/lib/coaching/gap-analysis'
import { ReferenceUpload } from '@/components/recordings/reference-upload'
import type { GapItem } from '@/lib/coaching/types'

export const metadata: Metadata = { title: 'Audition Readiness' }

// Demo data for unauthenticated visits
const DEMO_CATEGORY_SCORES: Record<string, number> = {
  tone: 78, intonation: 72, articulation: 65, dynamics: 81, musicality: 75, air: 71,
}
const DEMO_INSTRUMENT = 'alto-saxophone'
const DEMO_CURRENT_LEVEL = 'region'
const DEMO_TARGET_LEVEL = 'all-state'
const DEMO_TITLE = 'All-State Audition Excerpt'

function ReadinessRing({ pct }: { pct: number }) {
  const color = pct >= 80 ? '#34d399' : pct >= 50 ? '#a78bfa' : '#fbbf24'
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="text-6xl font-black tabular-nums leading-none"
        style={{ color }}
      >
        {pct}%
      </div>
      <div className="text-xs text-zinc-500 mt-1">audition ready</div>
    </div>
  )
}

function GapRow({ gap }: { gap: GapItem }) {
  const exceeds = gap.delta <= 0
  const barWidth = Math.min(100, (gap.current_score / Math.max(gap.target_score, 1)) * 100)
  const barColor = exceeds ? '#34d399' : gap.delta > 15 ? '#f87171' : gap.delta > 8 ? '#fbbf24' : '#a78bfa'
  const icon = exceeds
    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
    : gap.delta > 15
    ? <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
    : <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border-subtle last:border-0">
      {icon}
      <span className="text-sm text-zinc-300 w-32 flex-shrink-0">{gap.category_name}</span>
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${barWidth}%`, backgroundColor: barColor }}
        />
      </div>
      <span className="text-xs tabular-nums text-zinc-400 w-16 text-right">
        {gap.current_score} / {gap.target_score}
      </span>
      <span
        className="text-xs tabular-nums font-semibold w-10 text-right"
        style={{ color: exceeds ? '#34d399' : '#f87171' }}
      >
        {exceeds ? `+${Math.abs(gap.delta)}` : `-${gap.delta}`}
      </span>
    </div>
  )
}

interface ReferenceMaterial {
  id: string
  file_name: string
  file_type: string
  material_type: string
  created_at: string
}

export default async function ReadinessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const isDemo = id.startsWith('demo')

  let title = isDemo ? DEMO_TITLE : ''
  let instrument = isDemo ? DEMO_INSTRUMENT : 'alto-saxophone'
  let currentLevel = isDemo ? DEMO_CURRENT_LEVEL : 'intermediate'
  let targetLevel = isDemo ? DEMO_TARGET_LEVEL : 'all-state'
  let categoryScores: Record<string, number> = isDemo ? DEMO_CATEGORY_SCORES : {}
  let hasFeedback = isDemo
  let referenceMaterials: ReferenceMaterial[] = []
  let isAuthenticated = false

  if (!isDemo) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        isAuthenticated = true

        const [recResult, profileResult] = await Promise.all([
          supabase
            .from('recordings')
            .select(`
              title, instrument, status,
              feedback_reports (overall_score, estimated_level, report_json),
              reference_materials (id, file_name, file_type, material_type, created_at)
            `)
            .eq('id', id)
            .eq('user_id', user.id)
            .single(),
          supabase
            .from('profiles')
            .select('current_level, target_level')
            .eq('id', user.id)
            .single(),
        ])

        if (recResult.data) {
          const rec = recResult.data
          title = rec.title
          instrument = rec.instrument
          currentLevel = profileResult.data?.current_level ?? 'intermediate'
          targetLevel = profileResult.data?.target_level ?? 'all-state'

          const report = Array.isArray(rec.feedback_reports)
            ? rec.feedback_reports[0]
            : rec.feedback_reports

          if (report?.report_json) {
            const rj = report.report_json as Record<string, unknown>
            if (Array.isArray(rj.category_scores)) {
              const cs = rj.category_scores as Array<{ id: string; score: number }>
              categoryScores = Object.fromEntries(cs.map((c) => [c.id, c.score]))
              hasFeedback = true
            }
          } else {
            hasFeedback = false
          }

          if (Array.isArray(rec.reference_materials)) {
            referenceMaterials = rec.reference_materials as ReferenceMaterial[]
          }
        }
      }
    } catch {
      // fall through — hasFeedback stays false, isAuthenticated stays false
    }
  }

  const rubric = getRubric(instrument)
  const rubricForGap = rubric.map((r) => ({ id: r.id, name: r.name, weight: r.baseWeight }))
  const currentLevelDef = getLevelById(currentLevel)
  const targetLevelDef = getLevelById(targetLevel ?? 'all-state')
  const effectiveTarget = targetLevel ?? 'all-state'

  const gapResult = computeGapAnalysis(categoryScores, rubricForGap, currentLevel, effectiveTarget)

  const levelOptions = PERFORMANCE_LEVELS.filter(
    (l) => l.rank > (currentLevelDef?.rank ?? 0)
  )

  return (
    <>
      <Topbar
        title="Audition Readiness"
        subtitle={isDemo ? 'Demo data' : title || 'Audition Readiness'}
        actions={
          <Link href={`/dashboard/recordings/${id}`}>
            <button className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </Link>
        }
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-5">

          {/* Gap analysis — only available once a feedback report has been generated */}
          {hasFeedback ? (
            <>
              {/* Hero: readiness ring + level context */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <ReadinessRing pct={gapResult.readinessPct} />

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <Badge variant="default" className="text-xs" style={{ backgroundColor: `${currentLevelDef?.color}40`, color: currentLevelDef?.textColor }}>
                          Current: {currentLevelDef?.label ?? currentLevel}
                        </Badge>
                        <span className="text-zinc-600">→</span>
                        <Badge variant="violet" className="text-xs" style={{ backgroundColor: `${targetLevelDef?.color}40`, color: targetLevelDef?.textColor }}>
                          Target: {targetLevelDef?.label ?? effectiveTarget}
                        </Badge>
                        {isDemo && <Badge variant="amber">Demo</Badge>}
                      </div>

                      <p className="text-sm text-zinc-300 leading-relaxed">
                        {gapResult.categoriesMet.length} of {rubric.length} categories already meet {targetLevelDef?.label ?? effectiveTarget} standards.
                        {gapResult.readinessPct >= 80
                          ? ' You are very close to audition-ready — focus on the remaining gaps.'
                          : gapResult.readinessPct >= 50
                          ? ' Solid foundation with meaningful gaps to close before the audition.'
                          : ' Significant work remains across multiple categories.'}
                      </p>

                      {gapResult.topPriorities.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="text-xs text-zinc-500">Top gaps:</span>
                          {gapResult.topPriorities.map((p) => (
                            <Badge key={p.category} variant="default" className="text-[10px] bg-rose-500/15 text-rose-400">
                              {p.category_name} −{p.delta}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Category breakdown */}
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-4 h-4 text-zinc-400" />
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                      Category Gaps vs {targetLevelDef?.label ?? effectiveTarget}
                    </p>
                  </div>
                  <div>
                    {gapResult.gaps.map((gap) => (
                      <GapRow key={gap.category} gap={gap} />
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-[10px] text-zinc-600">
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Meets target</span>
                    <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-amber-400" /> Minor gap (≤8)</span>
                    <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-rose-400" /> Critical gap (&gt;15)</span>
                  </div>
                </CardContent>
              </Card>

              {/* Top priorities */}
              {gapResult.topPriorities.length > 0 && (
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-4 h-4 text-zinc-400" />
                      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Priority Focus Areas</p>
                    </div>
                    <div className="space-y-3">
                      {gapResult.topPriorities.map((p, i) => (
                        <div key={p.category} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-rose-500/15 flex items-center justify-center text-xs font-bold text-rose-400 shrink-0 mt-0.5">
                            {i + 1}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{p.category_name}</p>
                            <p className="text-xs text-zinc-400 mt-0.5">
                              Current score {p.current_score} — needs {p.target_score} for {targetLevelDef?.label ?? effectiveTarget}.
                              Close a <span className="text-rose-400 font-semibold">{p.delta}-point gap</span> to meet this standard.
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            /* No feedback report yet — show CTA */
            <Card>
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0">
                  <Target className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white mb-1">Generate a feedback report first</p>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Your gap analysis and audition readiness score are calculated from your coaching report.
                    Head to the Feedback tab to generate one, then come back here.
                  </p>
                  <Link
                    href={`/dashboard/recordings/${id}/feedback`}
                    className="inline-block mt-3 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    Go to Feedback →
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reference materials */}
          <Card>
            <CardContent className="p-5">
              {isAuthenticated && !isDemo ? (
                <ReferenceUpload recordingId={id} initialMaterials={referenceMaterials} />
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Reference Material</p>
                  <div className="border border-dashed border-zinc-700 rounded-lg p-4 text-center">
                    <p className="text-xs text-zinc-500">Sign in to attach a score or audition packet</p>
                    <p className="text-[10px] text-zinc-600 mt-1">Score-aware feedback unlocks note and rhythm accuracy analysis</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Level selector hint */}
          {isAuthenticated && !isDemo && levelOptions.length > 0 && (
            <div className="text-xs text-zinc-600 px-1 pb-4">
              <span className="text-zinc-500">Comparing against {targetLevelDef?.label ?? effectiveTarget} benchmarks. </span>
              Update your target level in{' '}
              <Link href="/dashboard/profile" className="text-blue-400 hover:text-blue-300 transition-colors">
                Profile Settings
              </Link>
              .
            </div>
          )}
        </div>
      </main>
    </>
  )
}
