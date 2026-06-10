'use client'

import { PERSONAS } from '@/lib/constants/personas'
import type { CoachingPersona } from '@/lib/types'
import { cn } from '@/lib/utils/cn'

interface PersonaSelectorProps {
  selected: CoachingPersona
  onChange: (persona: CoachingPersona) => void
  className?: string
}

export function PersonaSelector({ selected, onChange, className }: PersonaSelectorProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
          Coaching Perspective
        </p>
        <p className="text-[10px] text-zinc-600">Changes feedback framing and rubric weights</p>
      </div>

      {/* Scrollable row on mobile, wrapped grid on desktop */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {PERSONAS.map((persona) => {
          const isSelected = selected === persona.id
          return (
            <button
              key={persona.id}
              onClick={() => onChange(persona.id as CoachingPersona)}
              className={cn(
                'flex-shrink-0 flex flex-col gap-1.5 p-3 rounded-xl border text-left transition-all duration-150',
                'min-w-[130px] max-w-[160px]',
                isSelected
                  ? 'bg-violet-950/30 border-violet-500 shadow-[0_0_12px_rgba(124,58,237,0.15)]'
                  : 'bg-surface-DEFAULT border-border-DEFAULT hover:border-border-strong hover:bg-surface-raised'
              )}
              title={persona.description}
            >
              <div className="flex items-center gap-2">
                <span className="text-base leading-none select-none">{persona.emoji}</span>
                {isSelected && (
                  <span className="ml-auto w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-[8px] text-white font-bold">✓</span>
                  </span>
                )}
              </div>
              <div>
                <p
                  className={cn(
                    'text-xs font-semibold leading-none',
                    isSelected ? 'text-violet-200' : 'text-zinc-200'
                  )}
                >
                  {persona.label}
                </p>
                <p className="text-[10px] text-zinc-500 mt-1 leading-snug line-clamp-2">
                  {persona.description}
                </p>
              </div>

              {/* Priority categories */}
              {isSelected && (
                <div className="flex flex-wrap gap-1 pt-1 border-t border-border-subtle">
                  {persona.priorityCategories.slice(0, 2).map((cat) => (
                    <span
                      key={cat}
                      className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-violet-500/15 text-violet-300 capitalize"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
