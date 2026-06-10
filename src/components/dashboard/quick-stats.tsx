import { Mic, TrendingUp, Clock, Award } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'

interface QuickStatsProps {
  recordingCount: number
  avgScore: number | null
  hoursLogged: number | null
  currentLevel: string | null
}

export function QuickStats({ recordingCount, avgScore, hoursLogged, currentLevel }: QuickStatsProps) {
  const stats = [
    {
      label: 'Recordings',
      value: recordingCount > 0 ? String(recordingCount) : '0',
      icon: Mic,
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/15',
      empty: recordingCount === 0,
    },
    {
      label: 'Avg Score',
      value: avgScore != null ? String(Math.round(avgScore)) : '—',
      icon: TrendingUp,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/15',
      empty: avgScore == null,
    },
    {
      label: 'Hours Logged',
      value: hoursLogged != null && hoursLogged > 0 ? `${(hoursLogged / 3600).toFixed(1)}` : '—',
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/15',
      empty: !hoursLogged,
    },
    {
      label: 'Current Level',
      value: currentLevel ?? '—',
      icon: Award,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/15',
      empty: !currentLevel,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', stat.bgColor)}>
                  <Icon className={cn('w-4 h-4', stat.color)} />
                </div>
              </div>
              <div className="space-y-0.5">
                <div className={cn('text-2xl font-bold tracking-tight', stat.empty ? 'text-zinc-600' : stat.color)}>
                  {stat.value}
                </div>
                <div className="text-xs font-medium text-zinc-400">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
