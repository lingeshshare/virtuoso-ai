import { Mic, TrendingUp, Clock, Award } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'

interface StatItem {
  label: string
  value: string
  subtext?: string
  icon: React.ElementType
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  color: string
  bgColor: string
}

const MOCK_STATS: StatItem[] = [
  {
    label: 'Recordings',
    value: '12',
    subtext: 'total sessions',
    icon: Mic,
    trend: 'up',
    trendValue: '+3 this week',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/15',
  },
  {
    label: 'Avg Score',
    value: '74',
    subtext: 'out of 100',
    icon: TrendingUp,
    trend: 'up',
    trendValue: '+6 vs last month',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/15',
  },
  {
    label: 'Hours Logged',
    value: '8.5',
    subtext: 'this month',
    icon: Clock,
    trend: 'up',
    trendValue: '+2h vs last week',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/15',
  },
  {
    label: 'Current Level',
    value: 'Region',
    subtext: 'estimated benchmark',
    icon: Award,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/15',
  },
]

export function QuickStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {MOCK_STATS.map((stat) => {
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
                <div className={cn('text-2xl font-bold tracking-tight', stat.color)}>{stat.value}</div>
                <div className="text-xs font-medium text-zinc-400">{stat.label}</div>
                {stat.trend && (
                  <div className="text-[10px] text-emerald-400 font-medium">{stat.trendValue}</div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
