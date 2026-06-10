import type { Metadata } from 'next'
import Link from 'next/link'
import { Topbar } from '@/components/layout/topbar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Flame, ClipboardList } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Practice Plans' }

export default async function PracticePage() {
  let plans: Array<{
    id: string
    recordingTitle: string
    date: string
    totalMinutes: number
    priorityCount: number
    drills: string[]
  }> = []

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data } = await supabase
        .from('practice_plans')
        .select('id, created_at, drills_json, recordings(title)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (data) {
        plans = data.map((row) => {
          const dj = row.drills_json as Record<string, unknown>
          const drills: string[] = Array.isArray(dj?.drills)
            ? (dj.drills as Array<{ title?: string; name?: string }>).map((d) => d.title ?? d.name ?? String(d))
            : []
          const totalMinutes = typeof dj?.total_minutes === 'number' ? dj.total_minutes : drills.length * 10
          const priorityCount = Array.isArray(dj?.drills)
            ? (dj.drills as Array<{ priority?: string }>).filter((d) => d.priority === 'high').length
            : 0
          const rec = Array.isArray(row.recordings) ? row.recordings[0] : row.recordings
          return {
            id: row.id,
            recordingTitle: (rec as { title?: string } | null)?.title ?? 'Recording',
            date: row.created_at.split('T')[0],
            totalMinutes,
            priorityCount,
            drills,
          }
        })
      }
    }
  } catch {
    // fall through to empty state
  }

  return (
    <>
      <Topbar title="Practice Plans" subtitle="Drill lists from your sessions" />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-4">
          {plans.length === 0 ? (
            <div className="flex flex-col items-center text-center gap-4 py-20">
              <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                <ClipboardList className="w-7 h-7 text-violet-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white mb-1">No practice plans yet</h2>
                <p className="text-sm text-zinc-500 max-w-xs">
                  Upload a recording, run the analysis, and generate a feedback report to get your first practice plan.
                </p>
              </div>
              <Link href="/dashboard/upload">
                <Button variant="primary" size="md">Upload a recording</Button>
              </Link>
            </div>
          ) : (
            plans.map((plan) => (
              <Card key={plan.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-white">{plan.recordingTitle}</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">{plan.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-xs text-zinc-400">
                        <Clock className="w-3 h-3" />{plan.totalMinutes} min
                      </span>
                      {plan.priorityCount > 0 && (
                        <Badge variant="rose">
                          <Flame className="w-3 h-3" />
                          {plan.priorityCount} priority
                        </Badge>
                      )}
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {plan.drills.map((drill, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-xs text-zinc-300">
                        <span className="w-4 h-4 rounded flex-shrink-0 mt-0.5 border border-border-strong flex items-center justify-center text-zinc-600 font-bold">
                          {j + 1}
                        </span>
                        {drill}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </>
  )
}
