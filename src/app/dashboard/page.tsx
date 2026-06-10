import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Mic, TrendingUp } from 'lucide-react'
import { Topbar } from '@/components/layout/topbar'
import { QuickStats } from '@/components/dashboard/quick-stats'
import { RecordingCard } from '@/components/dashboard/recording-card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { getInstrumentById } from '@/lib/constants/instruments'
import { getLevelById } from '@/lib/constants/levels'

export const metadata: Metadata = { title: 'Dashboard' }

function formatDuration(s: number | null) {
  if (!s) return '—'
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`
}

export default async function DashboardPage() {
  let instrumentLabel = 'your instrument'
  let currentLevelLabel = '—'
  let targetLevelLabel = '—'
  let isNewUser = true
  let recordings: Array<{ id: string; instrument: string; title: string; date: string; duration: string; score: number | null; level: string; status: 'analyzed' | 'processing' | 'uploading' | 'error' }> = []
  let latestScores: number[] = []
  let todayDrills: Array<{ label: string; priority: string; done: boolean }> = []
  let practiceDate = ''

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const [profileResult, recordingsResult, practiceResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('instrument, current_level, target_level, onboarding_completed')
          .eq('id', user.id)
          .single(),
        supabase
          .from('recordings')
          .select(`
            id, title, instrument, duration_seconds, status, created_at,
            audio_metrics (engine),
            feedback_reports (overall_score, estimated_level)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('practice_plans')
          .select('drills_json, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
      ])

      if (profileResult.data) {
        const p = profileResult.data
        isNewUser = !p.onboarding_completed
        const inst = getInstrumentById(p.instrument ?? '')
        if (inst) instrumentLabel = inst.label
        currentLevelLabel = getLevelById(p.current_level ?? '')?.label ?? '—'
        targetLevelLabel = getLevelById(p.target_level ?? '')?.label ?? '—'
      }

      if (recordingsResult.data && recordingsResult.data.length > 0) {
        recordings = recordingsResult.data.map((rec) => {
          const report = Array.isArray(rec.feedback_reports)
            ? rec.feedback_reports[0]
            : rec.feedback_reports
          return {
            id: rec.id,
            instrument: rec.instrument,
            title: rec.title ?? 'Recording',
            date: rec.created_at.split('T')[0],
            duration: formatDuration(rec.duration_seconds),
            score: Math.round(report?.overall_score ?? 0) || null,
            level: getLevelById(report?.estimated_level ?? '')?.label ?? report?.estimated_level ?? '—',
            status: rec.status as 'analyzed' | 'processing' | 'uploading' | 'error',
          }
        })

        latestScores = recordingsResult.data
          .reverse()
          .map((r) => {
            const rpt = Array.isArray(r.feedback_reports) ? r.feedback_reports[0] : r.feedback_reports
            return Math.round(rpt?.overall_score ?? 0)
          })
          .filter((s) => s > 0)
      }

      if (practiceResult.data?.drills_json) {
        const plan = practiceResult.data.drills_json as Record<string, unknown>
        if (Array.isArray(plan.drills)) {
          todayDrills = (plan.drills as Array<{ title: string; category: string }>)
            .slice(0, 3)
            .map((d, i) => ({ label: d.title, priority: i === 0 ? 'high' : 'medium', done: false }))
        }
        practiceDate = new Date(practiceResult.data.created_at).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
        })
      }
    }
  } catch {
    // fall through to mock data
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  const scoreMin = Math.min(...latestScores, 55)
  const scoreMax = 100

  return (
    <>
      <Topbar
        title="Dashboard"
        subtitle={today}
        actions={
          <Link href="/dashboard/upload">
            <Button variant="primary" size="sm">
              <Mic className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New recording</span>
              <span className="sm:hidden">Record</span>
            </Button>
          </Link>
        }
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">

          {/* Onboarding nudge */}
          {isNewUser && (
            <div className="p-4 sm:p-5 rounded-2xl bg-violet-950/25 border border-violet-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <p className="text-sm font-semibold text-white mb-1">Upload your first recording</p>
                <p className="text-xs text-zinc-400">
                  Drop an audio file and get feedback within seconds.
                </p>
              </div>
              <Link href="/dashboard/upload" className="shrink-0">
                <Button variant="primary" size="md">
                  Upload now
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          )}

          {/* Stats */}
          <section>
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Overview</h2>
            <QuickStats />
          </section>

          {/* Goal banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-surface-DEFAULT border border-border-DEFAULT flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-0.5">Playing {instrumentLabel}</p>
                <p className="text-sm font-semibold text-white">
                  {currentLevelLabel} → {targetLevelLabel}
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/recordings"
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              View all recordings →
            </Link>
          </div>

          {/* Two-column layout */}
          <div className="grid lg:grid-cols-3 gap-5 sm:gap-6">
            {/* Recordings */}
            <section className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                  Recent Recordings
                </h2>
                <Link href="/dashboard/recordings" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                  View all
                </Link>
              </div>
              {recordings.map((r) => (
                <RecordingCard key={r.id} {...r} />
              ))}
              {recordings.length === 0 && (
                <div className="p-6 rounded-2xl bg-surface-DEFAULT border border-border-DEFAULT text-center">
                  <p className="text-sm text-zinc-400 mb-1">No recordings yet</p>
                  <p className="text-xs text-zinc-600">Upload your first recording to get started.</p>
                </div>
              )}
              <Link
                href="/dashboard/upload"
                className="flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-border-DEFAULT hover:border-violet-500/40 hover:bg-surface-raised transition-all text-sm text-zinc-500 hover:text-zinc-300"
              >
                <Mic className="w-4 h-4" />
                Add new recording
              </Link>
            </section>

            {/* Practice plan preview */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                  Today&apos;s Practice
                </h2>
                <Link href="/dashboard/practice" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                  Full plan
                </Link>
              </div>
              <div className="p-4 rounded-2xl bg-surface-DEFAULT border border-border-DEFAULT space-y-3">
                {todayDrills.length > 0 ? (
                  <>
                    {todayDrills.map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className={`w-4 h-4 rounded flex-shrink-0 mt-0.5 flex items-center justify-center border ${
                          item.done ? 'bg-emerald-500/20 border-emerald-500/40' : item.priority === 'high' ? 'border-rose-500/40' : 'border-border-strong'
                        }`}>
                          {item.done && <span className="text-[8px] text-emerald-400 font-bold">✓</span>}
                        </div>
                        <p className={`text-xs leading-relaxed ${item.done ? 'line-through text-zinc-600' : 'text-zinc-300'}`}>
                          {item.label}
                        </p>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-border-subtle">
                      <p className="text-[10px] text-zinc-600">From your last recording · {practiceDate}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-zinc-500 text-center py-2">
                    Your practice plan will appear here after your first feedback report.
                  </p>
                )}
              </div>

              {/* Score trend */}
              {latestScores.length >= 2 && (
                <div className="p-4 rounded-2xl bg-surface-DEFAULT border border-border-DEFAULT">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Score trend</p>
                  <div className="flex items-end gap-1.5 h-12">
                    {latestScores.map((score, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-sm ${i === latestScores.length - 1 ? 'bg-violet-500' : 'bg-violet-500/30'}`}
                        style={{ height: `${((score - scoreMin) / (scoreMax - scoreMin)) * 100}%`, minHeight: '8px' }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-[10px] text-zinc-600">{latestScores.length} sessions</span>
                    {latestScores.length >= 2 && (
                      <span className={`text-[10px] font-medium ${latestScores[latestScores.length - 1] >= latestScores[0] ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {latestScores[latestScores.length - 1] >= latestScores[0] ? '+' : ''}{latestScores[latestScores.length - 1] - latestScores[0]} total
                      </span>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </>
  )
}
