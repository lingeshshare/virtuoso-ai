'use client'

import { useState } from 'react'
import { Clock, Flame, Music, Target } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface ScheduledDrill {
  id: string
  title: string
  durationMinutes: number
  bpm?: number
  priority: 'high' | 'medium' | 'low'
  drillType: 'technical' | 'musical' | 'repetition' | 'slow-practice' | 'sectional'
  tags?: string[]
  completed?: boolean
}

export interface DaySchedule {
  dayLabel: string // 'Mon', 'Tue', etc.
  date?: string
  totalMinutes: number
  drills: ScheduledDrill[]
  isRest?: boolean
  isToday?: boolean
}

interface WeeklyScheduleProps {
  week: DaySchedule[]
  className?: string
}

const drillTypeIcon: Record<string, React.ElementType> = {
  technical: Flame,
  musical: Music,
  repetition: Target,
  'slow-practice': Clock,
  sectional: Target,
}

const priorityColors = {
  high: 'border-rose-500/30 bg-rose-500/5',
  medium: 'border-amber-500/30 bg-amber-500/5',
  low: 'border-border-DEFAULT bg-surface-raised',
}

export function WeeklySchedule({ week, className }: WeeklyScheduleProps) {
  const [selectedDay, setSelectedDay] = useState<number>(
    week.findIndex((d) => d.isToday) !== -1 ? week.findIndex((d) => d.isToday) : 0
  )

  const day = week[selectedDay]

  return (
    <div className={cn('space-y-4', className)}>
      {/* Day selector */}
      <div className="flex gap-1.5">
        {week.map((d, i) => (
          <button
            key={d.dayLabel}
            onClick={() => setSelectedDay(i)}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border text-center transition-all duration-150',
              selectedDay === i
                ? 'bg-violet-500/15 border-violet-500 text-violet-300'
                : d.isToday
                ? 'border-violet-500/30 bg-surface-raised text-zinc-200'
                : 'border-border-DEFAULT bg-surface-DEFAULT text-zinc-500 hover:text-zinc-300 hover:bg-surface-raised'
            )}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wide">{d.dayLabel}</span>
            {d.isRest ? (
              <span className="text-[9px] text-zinc-600">Rest</span>
            ) : (
              <span className="text-[9px] text-zinc-500">{d.totalMinutes}m</span>
            )}
            {d.isToday && (
              <span className="w-1 h-1 rounded-full bg-violet-400" />
            )}
          </button>
        ))}
      </div>

      {/* Day content */}
      {day.isRest ? (
        <div className="flex flex-col items-center justify-center py-8 text-zinc-600">
          <p className="text-sm font-medium">Rest Day</p>
          <p className="text-xs mt-1">Active rest — light listening or mental practice</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-0.5">
            <p className="text-xs font-semibold text-zinc-400">{day.dayLabel} — {day.totalMinutes} min session</p>
            <p className="text-[10px] text-zinc-600">
              {day.drills.filter((d) => d.completed).length}/{day.drills.length} complete
            </p>
          </div>

          {day.drills.map((drill) => {
            const Icon = drillTypeIcon[drill.drillType] ?? Target
            return (
              <div
                key={drill.id}
                className={cn(
                  'flex items-start gap-3 p-3.5 rounded-xl border transition-all',
                  drill.completed
                    ? 'opacity-50 border-border-subtle bg-transparent'
                    : priorityColors[drill.priority]
                )}
              >
                {/* Checkbox */}
                <div
                  className={cn(
                    'w-4 h-4 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center',
                    drill.completed
                      ? 'bg-emerald-500/20 border-emerald-500/40'
                      : drill.priority === 'high'
                      ? 'border-rose-500/50'
                      : drill.priority === 'medium'
                      ? 'border-amber-500/50'
                      : 'border-border-strong'
                  )}
                >
                  {drill.completed && <span className="text-[8px] text-emerald-400">✓</span>}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Icon className={cn(
                      'w-3 h-3 flex-shrink-0',
                      drill.drillType === 'technical' ? 'text-rose-400' : 'text-violet-400'
                    )} />
                    <span className={cn('text-xs font-semibold', drill.completed ? 'line-through text-zinc-600' : 'text-zinc-200')}>
                      {drill.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {drill.durationMinutes} min
                    </span>
                    {drill.bpm && <span className="font-mono">♩={drill.bpm}</span>}
                    {drill.tags?.slice(0, 2).map((tag) => (
                      <span key={tag} className="px-1.5 py-0.5 rounded bg-surface-overlay border border-border-subtle font-mono">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
