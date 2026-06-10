import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, BarChart3, ClipboardList, Cpu, Target } from 'lucide-react'
import { Topbar } from '@/components/layout/topbar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScoreBar } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase/server'
import { RecordingStatusPoller } from '@/components/recordings/recording-status-poller'

export const metadata: Metadata = { title: 'Recording' }

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatDate(ts: string): string {
  return new Date(ts).toISOString().split('T')[0]
}

// Mock data used for demo recordings (id starts with "demo-")
const MOCK = {
  title: 'All-State Audition Excerpt',
  instrument: 'Alto Saxophone',
  date: '2026-06-06',
  duration: '4:32',
  overallScore: 74,
  estimatedLevel: 'Region',
  targetLevel: 'All-State',
  status: 'analyzed',
  summary:
    'Strong foundational tone and musical instincts, but articulation consistency and upper-register air support need significant work before competing at All-State level.',
  categories: [
    { id: 'tone', name: 'Tone Quality', score: 78 },
    { id: 'intonation', name: 'Intonation', score: 72 },
    { id: 'articulation', name: 'Articulation', score: 65 },
    { id: 'dynamics', name: 'Dynamics', score: 81 },
    { id: 'musicality', name: 'Musicality', score: 75 },
    { id: 'air', name: 'Air Support', score: 71 },
  ],
  feedbackCount: 5,
  practiceItemCount: 4,
  engine: 'librosa 0.10.2',
}

export default async function RecordingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Demo route
  if (id.startsWith('demo')) {
    return <RecordingHub id={id} data={MOCK} isDemo />
  }

  // Real recording from Supabase
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return <RecordingError message="You must be signed in to view this recording." />
    }

    const { data: rec } = await supabase
      .from('recordings')
      .select(`
        id, title, instrument, duration_seconds, status, created_at, error_message,
        audio_metrics (engine, tempo_bpm, avg_loudness_db, onset_count, timing_score, dynamics_score),
        feedback_reports (overall_score, estimated_level, summary, report_json)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!rec) {
      return <RecordingError message="Recording not found." />
    }

    const report = Array.isArray(rec.feedback_reports)
      ? rec.feedback_reports[0]
      : rec.feedback_reports
    const metrics = Array.isArray(rec.audio_metrics)
      ? rec.audio_metrics[0]
      : rec.audio_metrics

    // Build category scores from report JSON if available
    let categories: { id: string; name: string; score: number }[] = []
    if (report?.report_json) {
      const rj = report.report_json as Record<string, unknown>
      if (Array.isArray(rj.category_scores)) {
        categories = rj.category_scores
      }
    } else if (metrics) {
      // Fallback: show available metrics scores before Phase 5 coaching
      categories = [
        { id: 'timing', name: 'Timing', score: Math.round(metrics.timing_score ?? 0) },
        { id: 'dynamics', name: 'Dynamics', score: Math.round(metrics.dynamics_score ?? 0) },
      ].filter((c) => c.score > 0)
    }

    const data = {
      title: rec.title,
      instrument: rec.instrument,
      date: formatDate(rec.created_at),
      duration: formatDuration(rec.duration_seconds),
      overallScore: report?.overall_score ?? null,
      estimatedLevel: report?.estimated_level ?? null,
      targetLevel: null,
      status: rec.status,
      summary: report?.summary ?? null,
      categories,
      feedbackCount: Array.isArray((report?.report_json as Record<string, unknown>)?.timestamp_items)
        ? ((report?.report_json as Record<string, unknown>).timestamp_items as unknown[]).length
        : 0,
      practiceItemCount: 0,
      engine: metrics?.engine ?? null,
      errorMessage: rec.error_message,
    }

    return <RecordingHub id={id} data={data} />
  } catch {
    return <RecordingError message="Failed to load recording. Please try again." />
  }
}

function RecordingError({ message }: { message: string }) {
  return (
    <>
      <Topbar
        title="Recording"
        subtitle="Error"
        actions={
          <Link href="/dashboard/recordings">
            <button className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              All recordings
            </button>
          </Link>
        }
      />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-sm text-zinc-400">{message}</p>
              <Link href="/dashboard/recordings" className="inline-block mt-4 text-xs text-violet-400 hover:text-violet-300">
                ← Back to recordings
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}

// ── RecordingHub component ──────────────────────────────────────────────────

interface RecordingData {
  title: string
  instrument: string
  date: string
  duration: string
  overallScore: number | null
  estimatedLevel: string | null
  targetLevel: string | null
  status: string
  summary: string | null
  categories: { id: string; name: string; score: number }[]
  feedbackCount: number
  practiceItemCount: number
  engine: string | null
  errorMessage?: string | null
}

function RecordingHub({ id, data, isDemo = false }: {
  id: string
  data: RecordingData
  isDemo?: boolean
}) {
  const isProcessing = data.status === 'processing' || data.status === 'uploading'
  const isError = data.status === 'error'
  const isAnalyzed = data.status === 'analyzed'

  return (
    <>
      <Topbar
        title={data.title}
        subtitle={`${data.instrument} · ${data.date}`}
        actions={
          <Link href="/dashboard/recordings">
            <button className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              All recordings
            </button>
          </Link>
        }
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-5">

          {/* Processing / error states */}
          {isProcessing && (
            <RecordingStatusPoller recordingId={id} />
          )}

          {isError && (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-rose-500/15 flex items-center justify-center mx-auto mb-3">
                  <span className="text-rose-400 text-xl">!</span>
                </div>
                <h3 className="text-base font-semibold text-white mb-2">Analysis failed</h3>
                <p className="text-sm text-zinc-400">
                  {data.errorMessage ?? 'Something went wrong during audio analysis.'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Main score card — show when analyzed or in demo mode */}
          {(isAnalyzed || isDemo) && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  {/* Score */}
                  <div className="flex-shrink-0 text-center">
                    {data.overallScore != null ? (
                      <>
                        <div
                          className="text-6xl font-black tabular-nums leading-none"
                          style={{
                            color:
                              data.overallScore >= 80
                                ? '#34d399'
                                : data.overallScore >= 60
                                ? '#a78bfa'
                                : '#fbbf24',
                          }}
                        >
                          {Math.round(data.overallScore)}
                        </div>
                        <div className="text-xs text-zinc-500 mt-1">out of 100</div>
                      </>
                    ) : (
                      <div className="text-4xl font-black text-zinc-600">—</div>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {data.estimatedLevel && <Badge variant="amber">{data.estimatedLevel} Level</Badge>}
                      {data.targetLevel && (
                        <>
                          <span className="text-zinc-600 text-xs">→</span>
                          <Badge variant="violet">Target: {data.targetLevel}</Badge>
                        </>
                      )}
                      {!data.estimatedLevel && !isDemo && (
                        <Badge variant="default">Awaiting feedback</Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-zinc-500 mb-4">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{data.date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{data.duration}</span>
                    </div>

                    {data.summary ? (
                      <p className="text-sm text-zinc-300 leading-relaxed">{data.summary}</p>
                    ) : (
                      <p className="text-sm text-zinc-500 italic">
                        Feedback report will appear here once coaching is complete.
                      </p>
                    )}
                  </div>
                </div>

                {/* Mini scorecard */}
                {data.categories.length > 0 && (
                  <div className="mt-5 space-y-2.5 pt-5 border-t border-border-subtle">
                    {data.categories.map((cat) => (
                      <div key={cat.id} className="flex items-center gap-3">
                        <span className="text-xs text-zinc-400 w-28 flex-shrink-0">{cat.name}</span>
                        <ScoreBar score={cat.score} className="flex-1" />
                        <span className="text-xs font-bold tabular-nums text-zinc-300 w-8 text-right">{cat.score}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Navigation cards */}
          {(isAnalyzed || isDemo) && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href={`/dashboard/recordings/${id}/feedback`} className="group">
                <Card interactive className="h-full">
                  <CardContent className="p-5 flex flex-col gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center group-hover:bg-violet-500/25 transition-colors">
                      <BarChart3 className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white mb-1">Full Feedback Report</p>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {data.feedbackCount > 0
                          ? `${data.feedbackCount} timestamp observations with cause, fix, and drill.`
                          : 'Timestamp-specific observations with coaching feedback.'}
                      </p>
                    </div>
                    <span className="text-xs text-violet-400 font-medium">View report →</span>
                  </CardContent>
                </Card>
              </Link>

              <Link href={`/dashboard/recordings/${id}/practice`} className="group">
                <Card interactive className="h-full">
                  <CardContent className="p-5 flex flex-col gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center group-hover:bg-emerald-500/25 transition-colors">
                      <ClipboardList className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white mb-1">Practice Plan</p>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {data.practiceItemCount > 0
                          ? `${data.practiceItemCount} targeted drills — prioritized by impact.`
                          : 'Targeted drills generated from your coaching report.'}
                      </p>
                    </div>
                    <span className="text-xs text-emerald-400 font-medium">Open plan →</span>
                  </CardContent>
                </Card>
              </Link>

              <Link href={`/dashboard/recordings/${id}/readiness`} className="group">
                <Card interactive className="h-full">
                  <CardContent className="p-5 flex flex-col gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center group-hover:bg-amber-500/25 transition-colors">
                      <Target className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white mb-1">Audition Readiness</p>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Gap analysis: how close you are to your target audition level.
                      </p>
                    </div>
                    <span className="text-xs text-amber-400 font-medium">View gaps →</span>
                  </CardContent>
                </Card>
              </Link>

              <Link href={`/dashboard/recordings/${id}/metrics`} className="group">
                <Card interactive className="h-full">
                  <CardContent className="p-5 flex flex-col gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center group-hover:bg-blue-500/25 transition-colors">
                      <Cpu className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white mb-1">Raw Metrics</p>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Audio metrics, onset map, dynamics curve, and spectral data.
                      </p>
                    </div>
                    <span className="text-xs text-blue-400 font-medium">Debug view →</span>
                  </CardContent>
                </Card>
              </Link>
            </div>
          )}

          {isDemo && (
            <div className="px-1 pb-2">
              <span className="text-xs text-amber-600">Demo data</span>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
