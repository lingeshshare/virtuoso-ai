'use client'

import { Check } from 'lucide-react'
import { PERFORMANCE_LEVELS } from '@/lib/constants/levels'
import { cn } from '@/lib/utils/cn'
import type { PerformanceLevel } from '@/lib/types'

interface LevelSelectorProps {
  selected: string | null
  onSelect: (level: PerformanceLevel) => void
  minRank?: number
  label?: string
}

const tierLabels: Record<string, string> = {
  foundation: 'Foundation',
  competitive: 'Honor Ensemble',
  elite: 'Elite',
}

const tierColors: Record<string, string> = {
  foundation: 'text-zinc-500',
  competitive: 'text-amber-500/70',
  elite: 'text-violet-400/70',
}

export function LevelSelector({ selected, onSelect, minRank = 1 }: LevelSelectorProps) {
  const levels = PERFORMANCE_LEVELS.filter((l) => l.rank >= minRank)

  const grouped = levels.reduce<Record<string, PerformanceLevel[]>>((acc, level) => {
    const tier = level.tier
    if (!acc[tier]) acc[tier] = []
    acc[tier].push(level)
    return acc
  }, {})

  const tierOrder = ['foundation', 'competitive', 'elite']

  return (
    <div className="space-y-5">
      {tierOrder.map((tier) => {
        const tierLevels = grouped[tier]
        if (!tierLevels?.length) return null

        return (
          <div key={tier}>
            <p className={cn('text-xs font-semibold uppercase tracking-widest mb-2.5', tierColors[tier])}>
              {tierLabels[tier]}
            </p>
            <div className="space-y-2">
              {tierLevels.map((level) => {
                const isSelected = selected === level.id

                return (
                  <button
                    key={level.id}
                    onClick={() => onSelect(level)}
                    className={cn(
                      'w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-150',
                      isSelected
                        ? 'border-violet-500 bg-violet-950/25 shadow-[0_0_20px_rgba(124,58,237,0.15)]'
                        : 'border-border-DEFAULT bg-surface-DEFAULT hover:border-border-strong hover:bg-surface-raised'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {/* Level color indicator */}
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: level.textColor }}
                      />
                      <div>
                        <div
                          className={cn(
                            'text-sm font-semibold transition-colors',
                            isSelected ? 'text-white' : 'text-zinc-200'
                          )}
                        >
                          {level.label}
                        </div>
                        <div className="text-xs text-zinc-500 mt-0.5">{level.description}</div>
                      </div>
                    </div>

                    {isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-border-strong flex-shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
