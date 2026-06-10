import type { Metadata } from 'next'
import Link from 'next/link'
import { TrendingUp, Calendar, Award, Target } from 'lucide-react'
import { Topbar } from '@/components/layout/topbar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase/server'
import { getLevelById } from '@/lib/constants/levels'
import { getRubric } from '@/lib/constants/rubrics'
import { getBenchmarkScore } from '@/lib/coaching/benchmarks'
import { getInstrumentById } from '@/lib/constants/instruments'

export const metadata: Metadata = { title: 'Progress' }

// ─── Types ─────────────────────────────────────────────────────────────────

interface SessionRow {
  id: string
  title: string
  instrument: string
  date: string
  shortDate: string
  score: number
  level: string
}

interface CategoryTrend {
  id: string
  name: string
  scores: number[]
  target: number
}

// ─── Demo fallback ──────────────────────────────────────────────────────────

const DEMO_SESSIONS: SessionRow[] = [
  { id: 's1', date: 'May 12', shortDate: '5/12', score: 68, level: 'Advanced', instrument: 'Alto Saxophone', title: 'Scale Packet' },
  { id: 's2', date: 'May 16', shortDate: '5/16', score: 70, level: 'Advanced', instrument: 'Alto Saxophone', title: 'Warm-up Routine' },
  { id: 's3', date: 'May 19', shortDate: '5/19', score: 69, level: 'Advanced', instrument: 'Alto Saxophone', title: 'Audition Excerpt' },
  { id: 's4', date: 'May 23', shortDate: '5/23', score: 72, level: 'Region', instrument: 'Alto Saxophone', title: 'Concerto Mvt. I' },
  { id: 's5', date: 'May 28', shortDate: '5/28', score: 71, level: 'Region', instrument: 'Alto Saxophone', title: 'Long-tone Routine' },
  { id: 's6', date: 'Jun 2', shortDate: '6/2', score: 74, level: 'Region', instrument: 'Alto Saxophone', title: 'Scale Packet — E Major' },
  { id: 's7', date: 'Jun 6', shortDate: '6/6', score: 74, level: 'Region', instrument: 'Alto Saxophone', title: 'All-State Excerpt' },
]

const DEMO_CATEGORY_TRENDS: CategoryTrend[] = [
  { id: 'tone', name: 'Tone Quality', scores: [70, 72, 71, 74, 73, 77, 78], target: 87 },
  { id: 'intonation', name: 'Intonation', scores: [66, 68, 70, 72, 70, 72, 72], target: 86 },
  { id: 'articulation', name: 'Articulation', scores: [62, 64, 63, 67, 65, 64, 65], target: 86 },
  { id: 'dynamics', name: 'Dynamics', scores: [78, 79, 78, 80, 79, 81, 81], target: 85 },
  { id: 'musicality', name: 'Musicality', scores: [72, 73, 73, 74, 73, 75, 75], target: 85 },
  { id: 'air', name: 'Air Support', scores: [68, 69, 68, 70, 70, 71, 71], target: 87 },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sparkColor(score: number): string {
  if (score >= 85) return 'bg-emerald-500'
  if (score >= 70) return 'bg-violet-500'
  if (score >= 55) return 'bg-amber-500'
  return 'bg-rose-500'
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? 'text-emerald-400' : score >= 65 ? 'text-violet-300' : score >= 50 ? 'text-amber-400' : 'text-rose-400'
  return <span className={`text-xs font-bold tabular-nums ${color}`}>{score}</span>
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SessionBarChart({ sessions }: { sessions: SessionRow[] }) {
  const min = 55
  const max = 100
  const latest = sessions[sessions.length - 1].score
  const first = sessions[0].score
  const delta = latest - first

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Overall Score</p>
          <p className="text-xs text-zinc-600 mt-0.5">Last {sessions.length} sessions</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-3xl font-black text-violet-300 tabular-nums">{latest}</span>
          <Badge variant={delta > 0 ? 'emerald' : 'rose'} dot>
            {delta > 0 ? '+' : ''}{delta} from start
          </Badge>
        </div>
      </div>

      <div className="flex items-end gap-2.5 h-36">
        {sessions.map((session, i) => {
          const heightPct = ((session.score - min) / (max - min)) * 100
          const isLatest = i === sessions.length - 1
          return (
            <div key={session.id} className="flex-1 flex flex-col items-center gap-1.5 group">
              <ScoreBadge score={session.score} />
              <div className="w-full flex items-end" style={{ height: '88px' }}>
                <div
                  className={`w-full rounded-t-md transition-all ${isLatest ? 'bg-violet-500 shadow-glow-violet' : 'bg-violet-500/30 group-hover:bg-violet-500/50'}`}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
              <span className="text-[9px] text-zinc-600 tabular-nums">{session.shortDate}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CategoryTrendRow({ trend }: { trend: CategoryTrend }) {
  const latest = trend.scores[trend.scores.length - 1]
  const first = trend.scores[0]
  const delta = latest - first
  const gapToTarget = trend.target - latest

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-300">{trend.name}</span>
          {delta > 0 && <span className="text-[10px] font-medium text-emerald-400">+{delta}</span>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-zinc-600">Target: {trend.target}</span>
          <span className={`text-xs font-bold tabular-nums ${gapToTarget > 10 ? 'text-rose-400' : gapToTarget > 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {latest}
          </span>
        </div>
      </div>

      <div className="flex items-end gap-1 h-6">
        {trend.scores.map((score, i) => {
          const pct = ((score - 50) / 50) * 100
          const isLatest = i === trend.scores.length - 1
          return (
            <div
              key={i}
              className={`flex-1 rounded-sm ${isLatest ? sparkColor(score) : `${sparkColor(score)}/30`}`}
              style={{ height: `${Math.max(8, pct)}%` }}
            />
          )
        })}
      </div>

      <Progress value={latest} max={trend.target} color={gapToTarget > 10 ? 'rose' : gapToTarget > 5 ? 'amber' : 'emerald'} size="sm" />
    </div>
  )
}

function BenchmarkTable({
  trends,
  targetLevel,
}: {
  trends: CategoryTrend[]
  targetLevel: string
}) {
  const targetDef = getLevelById(targetLevel)
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-DEFAULT">
            <th className="text-left text-[10px] font-semibold text-zinc-500 uppercase tracking-widest pb-2 pr-4">Category</th>
            <th className="text-right text-[10px] font-semibold text-zinc-500 uppercase tracking-widest pb-2 px-3">You</th>
            <th className="text-right text-[10px] font-semibold text-zinc-500 uppercase tracking-widest pb-2 px-3">{targetDef?.label ?? targetLevel}</th>
            <th className="text-right text-[10px] font-semibold text-zinc-500 uppercase tracking-widest pb-2 pl-3">Gap</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {trends.map((trend) => {
            const myScore = trend.scores[trend.scores.length - 1]
            const benchmark = trend.target
            const gap = benchmark - myScore
            return (
              <tr key={trend.id}>
                <td className="py-2.5 pr-4 text-zinc-300 font-medium">{trend.name}</td>
                <td className="py-2.5 px-3 text-right"><ScoreBadge score={myScore} /></td>
                <td className="py-2.5 px-3 text-right">
                  <span className="text-xs text-zinc-400 tabular-nums">{benchmark}</span>
                </td>
                <td className="py-2.5 pl-3 text-right">
                  <span className={`text-xs font-bold tabular-nums ${gap <= 0 ? 'text-emerald-400' : gap <= 5 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {gap <= 0 ? '✓' : `+${gap}`}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProgressPage() {
  let sessions: SessionRow[] = DEMO_SESSIONS
  let categoryTrends: CategoryTrend[] = DEMO_CATEGORY_TRENDS
  let currentLevelLabel = 'Region'
  let targetLevel = 'all-state'
  let instrumentLabel = 'Alto Saxophone'
  let isDemo = true

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const [profileResult, recordingsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('current_level, target_level, instrument')
          .eq('id', user.id)
          .single(),
        supabase
          .from('recordings')
          .select(`
            id, title, instrument, created_at, status,
            feedback_reports (overall_score, estimated_level, report_json)
          `)
          .eq('user_id', user.id)
          .eq('status', 'analyzed')
          .order('created_at', { ascending: true })
          .limit(20),
      ])

      const profile = profileResult.data
      const recordings = recordingsResult.data ?? []

      if (profile) {
        targetLevel = profile.target_level ?? 'all-state'
        currentLevelLabel = getLevelById(profile.current_level ?? 'region')?.label ?? 'Region'
        const instrDef = getInstrumentById(profile.instrument ?? 'alto-saxophone')
        instrumentLabel = instrDef?.label ?? 'Instrument'
      }

      // Build sessions from recordings with feedback reports
      const realSessions: SessionRow[] = []
      for (const rec of recordings) {
        const report = Array.isArray(rec.feedback_reports)
          ? rec.feedback_reports[0]
          : rec.feedback_reports
        if (!report?.overall_score) continue

        const d = new Date(rec.created_at)
        realSessions.push({
          id: rec.id,
          title: rec.title ?? 'Recording',
          instrument: rec.instrument,
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          shortDate: `${d.getMonth() + 1}/${d.getDate()}`,
          score: Math.round(report.overall_score),
          level: getLevelById(report.estimated_level ?? '')?.label ?? report.estimated_level ?? 'Unknown',
        })
      }

      if (realSessions.length >= 1) {
        sessions = realSessions
        isDemo = false

        // Build category trends from report_json category_scores
        const catMap: Record<string, { name: string; scores: number[] }> = {}
        for (const rec of recordings) {
          const report = Array.isArray(rec.feedback_reports)
            ? rec.feedback_reports[0]
            : rec.feedback_reports
          if (!report?.report_json) continue
          const rj = report.report_json as Record<string, unknown>
          if (!Array.isArray(rj.category_scores)) continue
          for (const cs of rj.category_scores as Array<{ id: string; name: string; score: number }>) {
            if (!catMap[cs.id]) catMap[cs.id] = { name: cs.name, scores: [] }
            catMap[cs.id].scores.push(Math.round(cs.score))
          }
        }

        const instrument = profile?.instrument ?? 'alto-saxophone'
        const rubric = getRubric(instrument)
        categoryTrends = rubric
          .filter((r) => catMap[r.id])
          .map((r) => ({
            id: r.id,
            name: r.name,
            scores: catMap[r.id].scores,
            target: getBenchmarkScore(targetLevel, r.id),
          }))

        // Don't fall back to demo trends when we have real session data
      }
    }
  } catch {
    // fall through to demo data
  }

  const latestScore = sessions[sessions.length - 1].score
  const firstScore = sessions[0].score
  const totalDelta = latestScore - firstScore
  const targetLevelDef = getLevelById(targetLevel)

  return (
    <>
      <Topbar
        title="Progress"
        subtitle={`${sessions.length} sessions · ${instrumentLabel}${isDemo ? ' · Demo' : ''}`}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

          {/* Stat chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Sessions', value: sessions.length, icon: Calendar, color: 'text-violet-400', bg: 'bg-violet-500/15' },
              { label: 'Score gain', value: `${totalDelta >= 0 ? '+' : ''}${totalDelta}`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
              { label: 'Current level', value: currentLevelLabel, icon: Award, color: 'text-amber-400', bg: 'bg-amber-500/15' },
              { label: 'Target level', value: targetLevelDef?.label ?? targetLevel, icon: Target, color: 'text-blue-400', bg: 'bg-blue-500/15' },
            ].map((s) => {
              const Icon = s.icon
              return (
                <Card key={s.label}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${s.color}`} />
                    </div>
                    <div>
                      <div className={`text-lg font-black leading-none ${s.color}`}>{s.value}</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">{s.label}</div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Overall trend */}
          <Card>
            <CardContent className="p-6">
              <SessionBarChart sessions={sessions} />
            </CardContent>
          </Card>

          {/* Category trends + benchmark table */}
          <div className="grid lg:grid-cols-2 gap-5">
            <Card>
              <CardContent className="p-6 space-y-5">
                <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                  Category Trends
                  <span className="ml-2 normal-case tracking-normal font-normal text-zinc-700">
                    — last {sessions.length} sessions
                  </span>
                </h2>
                {categoryTrends.map((trend) => (
                  <CategoryTrendRow key={trend.id} trend={trend} />
                ))}
              </CardContent>
            </Card>

            <div className="space-y-5">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">
                    vs. {targetLevelDef?.label ?? targetLevel} Benchmark
                  </h2>
                  <BenchmarkTable trends={categoryTrends} targetLevel={targetLevel} />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">Quick Links</h2>
                  <div className="space-y-2">
                    <Link href="/dashboard/recordings" className="flex items-center gap-2 text-sm text-zinc-300 hover:text-white transition-colors">
                      <span className="text-zinc-500">→</span> All Recordings
                    </Link>
                    <Link href="/dashboard/practice" className="flex items-center gap-2 text-sm text-zinc-300 hover:text-white transition-colors">
                      <span className="text-zinc-500">→</span> Practice Dashboard
                    </Link>
                    <Link href="/dashboard/profile" className="flex items-center gap-2 text-sm text-zinc-300 hover:text-white transition-colors">
                      <span className="text-zinc-500">→</span> Update Target Level
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Session history */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Session History</h2>
                <Link href="/dashboard/recordings" className="text-xs text-violet-400 hover:text-violet-300">
                  View all recordings →
                </Link>
              </div>
              <div className="space-y-2">
                {[...sessions].reverse().map((s) => (
                  <Link
                    key={s.id}
                    href={s.id.startsWith('s') ? '/dashboard/recordings/demo' : `/dashboard/recordings/${s.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-raised transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-surface-overlay flex items-center justify-center flex-shrink-0">
                      <ScoreBadge score={s.score} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-zinc-200 truncate">{s.title}</p>
                      <p className="text-[10px] text-zinc-500">{s.date}</p>
                    </div>
                    <Badge variant="default" className="text-[10px] flex-shrink-0">{s.level}</Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {isDemo && (
            <p className="text-xs text-zinc-600 text-center">
              Showing demo data. Analyze a recording and generate a feedback report to see your real progress.
            </p>
          )}
        </div>
      </main>
    </>
  )
}
