'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { INSTRUMENT_CATEGORIES } from '@/lib/constants/instruments'
import { cn } from '@/lib/utils/cn'
import type { Instrument } from '@/lib/types'

interface InstrumentGridProps {
  selected: string | null
  onSelect: (instrument: Instrument) => void
}

export function InstrumentGrid({ selected, onSelect }: InstrumentGridProps) {
  const [activeCategory, setActiveCategory] = useState<string>('woodwinds')

  const category = INSTRUMENT_CATEGORIES.find((c) => c.id === activeCategory)

  return (
    <div className="space-y-5">
      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap">
        {INSTRUMENT_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
              activeCategory === cat.id
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-surface-raised border border-transparent'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Instrument cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {category?.instruments.map((instrument) => {
          const isSelected = selected === instrument.id
          return (
            <button
              key={instrument.id}
              onClick={() => onSelect(instrument)}
              className={cn(
                'relative group flex flex-col items-center gap-2.5 p-4 rounded-2xl border text-center transition-all duration-150',
                isSelected
                  ? 'bg-violet-950/30 border-violet-500 shadow-glow-violet'
                  : 'bg-surface-DEFAULT border-border-DEFAULT hover:border-border-strong hover:bg-surface-raised hover:-translate-y-0.5'
              )}
            >
              {isSelected && (
                <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </span>
              )}
              <span className="text-2xl leading-none select-none">{instrument.emoji}</span>
              <span
                className={cn(
                  'text-sm font-medium leading-tight transition-colors',
                  isSelected ? 'text-white' : 'text-zinc-300 group-hover:text-white'
                )}
              >
                {instrument.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
