import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Clock, Flame, Target, Music, Calendar, ClipboardList } from 'lucide-react'
import { Topbar } from '@/components/layout/topbar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { WeeklySchedule } from '@/components/practice/weekly-schedule'
import type { DaySchedule } from '@/components/practice/weekly-schedule'
import { createClient } from '@/lib/supabase/server'
import type { PracticePlan, PracticeDrill } from '@/lib/coaching/types'

export const metadata: Metadata = { title: 'Practice Plan' }

function DrillTypeIcon({ type }: { type: string }) {
  if (type === 'technique' || type === 'long-tone' || type === 'scale') return <Flame className="w-3.5 h-3.5 text-rose-400" />
  if (type === 'musical' || type === 'etude') return <Music className="w-3.5 h-3.5 text-violet-400" />
  return <Target className="w-3.5 h-3.5 text-emerald-400" />
}

function PriorityBadge({ priority }: { priority: number }) {
  if (priority === 1) return <Badge variant="rose">Priority</Badge>
  if (priority === 2) return <Badge variant="amber">Medium</Badge>
  return <Badge variant="default">Low</Badge>
}

function planToWeekSchedule(plan: PracticePlan): DaySchedule[] {
  const drillMap = Object.fromEntries(plan.drills.map((d) => [d.id, d]))
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return days.map((day, i) => {
    const drillIds = plan.weekly_schedule?.[day] ?? []
    const drills = drillIds
      .map((did) => drillMap[did])
      .filter(Boolean)
      .map((d) => ({
        id: d.id,
        title: d.title,
        durationMinutes: d.duration_minutes,
        priority: d.priority === 1 ? 'high' as const : d.priority === 2 ? 'medium' as const : 'low' as const,
        drillType: (() => {
          switch (d.type) {
            case 'long-tone': return 'slow-practice' as const
            case 'musical': case 'etude': return 'musical' as const
            case 'rhythm': return 'repetition' as const
            default: return 'technical' as const
          }
        })(),
        bpm: d.bpm,
        tags: d.tags,
      }))

    return {
      dayLabel: dayLabels[i],
      totalMinutes: drills.reduce((s, d) => s + d.durationMinutes, 0),
      isRest: drills.length === 0,
      drills,
    }
  })
}

export default async function PracticePlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let plan: PracticePlan | null = null
  let recordingTitle = 'Recording'
  let planDate: string | null = null

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Fetch practice plan and recording title in parallel, no FK join needed
      const [planResult, recResult] = await Promise.all([
        supabase
          .from('practice_plans')
          .select('drills_json, created_at')
          .eq('recording_id', id)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('recordings')
          .select('title')
          .eq('id', id)
          .eq('user_id', user.id)
          .maybeSingle(),
      ])

      if (recResult.data?.title) recordingTitle = recResult.data.title

      if (planResult.data?.drills_json) {
        const raw = planResult.data.drills_json as Record<string, unknown>
        if (Array.isArray(raw.drills)) {
          plan = raw as unknown as PracticePlan
          planDate = new Date(planResult.data.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        }
      }
    }
  } catch {
    // fall through to empty state
  }

  if (!plan) {
    return (
      <>
        <Topbar
          title="Practice Plan"
          subtitle={recordingTitle}
          actions={
            <Link href={`/dashboard/recordings/${id}/feedback`}>
              <button className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Feedback
              </button>
            </Link>
          }
        />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-16 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center">
              <ClipboardList className="w-7 h-7 text-violet-400" />
            </div>
            <h2 className="text-base font-semibold text-white">No practice plan yet</h2>
            <p className="text-sm text-zinc-500 max-w-xs">
              Generate a feedback report first. Your practice plan is built automatically from the coaching analysis.
            </p>
            <Link
              href={`/dashboard/recordings/${id}/feedback`}
              className="mt-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
            >
              Go to Feedback →
            </Link>
          </div>
        </main>
      </>
    )
  }

  const drills: PracticeDrill[] = plan.drills.sort((a, b) => a.priority - b.priority)
  const totalMinutes = drills.reduce((s, d) => s + (d.duration_minutes ?? 0), 0)
  const highPriority = drills.filter((d) => d.priority === 1).length
  const weekSchedule = planToWeekSchedule(plan)

  return (
    <>
      <Topbar
        title="Practice Plan"
        subtitle={`${recordingTitle} · ${drills.length} drills`}
        actions={
          <Link href={`/dashboard/recordings/${id}/feedback`}>
            <button className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Feedback
            </button>
          </Link>
        }
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-DEFAULT border border-border-DEFAULT flex-wrap">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
                <Clock className="w-4 h-4 text-violet-400" />
              </div>
              <span className="font-semibold text-white">{totalMinutes} min</span>
              <span className="text-zinc-500">/ session</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded-lg bg-rose-500/15 flex items-center justify-center">
                <Flame className="w-4 h-4 text-rose-400" />
              </div>
              <span className="font-semibold text-rose-400">{highPriority}</span>
              <span className="text-zinc-500">priority drills</span>
            </div>
            {planDate && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-zinc-400">Generated {planDate}</span>
              </div>
            )}
            {Array.isArray(plan.focus_areas) && plan.focus_areas.length > 0 && (
              <div className="ml-auto flex items-center gap-1.5">
                {plan.focus_areas.slice(0, 2).map((f) => (
                  <span key={f} className="text-[10px] text-zinc-500 bg-surface-overlay px-2 py-0.5 rounded-md border border-border-subtle">
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <section className="space-y-4">
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Drill List</h2>
              {drills.map((drill, i) => (
                <Card key={drill.id} className={drill.priority === 1 ? 'border-rose-500/20' : ''}>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-md bg-surface-overlay flex items-center justify-center text-[10px] font-bold text-zinc-400 flex-shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <h3 className="text-sm font-semibold text-white leading-snug">{drill.title}</h3>
                      </div>
                      <PriorityBadge priority={drill.priority} />
                    </div>

                    <div className="flex items-center gap-3 ml-[34px]">
                      <span className="flex items-center gap-1 text-xs text-zinc-500">
                        <Clock className="w-3 h-3" />{drill.duration_minutes} min
                      </span>
                      {drill.bpm && <span className="text-xs text-zinc-500 font-mono">♩={drill.bpm}</span>}
                      <span className="flex items-center gap-1 text-xs text-zinc-500">
                        <DrillTypeIcon type={drill.type} />
                        {drill.type.replace('-', ' ')}
                      </span>
                    </div>

                    <p className="text-sm text-zinc-300 leading-relaxed ml-[34px]">{drill.description}</p>

                    {drill.source_observation && (
                      <div className="ml-[34px] flex items-center gap-1.5 text-[10px] text-zinc-600">
                        <span>From:</span>
                        <span className="text-zinc-500 font-mono">{drill.source_observation}</span>
                      </div>
                    )}

                    {drill.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 ml-[34px]">
                        {drill.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 rounded-md bg-base-800 border border-border-subtle text-[10px] text-zinc-500 font-mono">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </section>

            <section className="space-y-4">
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Weekly Schedule</h2>
              <Card>
                <CardContent className="p-5">
                  <WeeklySchedule week={weekSchedule} />
                </CardContent>
              </Card>

              <Card variant="bordered">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Practice principles</p>
                  <ul className="space-y-2 text-xs text-zinc-400">
                    {[
                      'Always slow down before speeding up. Never practice mistakes.',
                      'Record and review at least once per week. Compare to prior recordings.',
                      '3 consecutive clean runs before increasing tempo. No exceptions.',
                      'Prioritize high-priority drills first while energy is highest.',
                    ].map((p) => (
                      <li key={p} className="flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-violet-500 mt-1.5 flex-shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </main>
    </>
  )
}
