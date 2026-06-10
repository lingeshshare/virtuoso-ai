import type { Metadata } from 'next'
import { Topbar } from '@/components/layout/topbar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Flame } from 'lucide-react'

export const metadata: Metadata = { title: 'Practice Plans' }

const MOCK_PLANS = [
  {
    date: '2026-06-06',
    recordingTitle: 'All-State Audition Excerpt',
    totalMinutes: 40,
    priorityCount: 2,
    drills: [
      'Articulation — repeated-note single tongue at ♩=84',
      'Altissimo long-tones E5–G5 with air support focus',
      'Scalar passage tempo lock at ♩=88',
      'Opening phrase consolidation',
    ],
  },
  {
    date: '2026-06-04',
    recordingTitle: 'Concerto in E♭ Major, Mvt. I',
    totalMinutes: 35,
    priorityCount: 3,
    drills: [
      'Intonation tuning — altissimo register',
      'Dynamics gradient through the development',
      'Cadenza preparation — slow practice',
    ],
  },
]

export default function PracticePage() {
  return (
    <>
      <Topbar title="Practice Plans" subtitle="Drill lists from your sessions" />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-4">
          {MOCK_PLANS.map((plan, i) => (
            <Card key={i}>
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
          ))}
        </div>
      </main>
    </>
  )
}
