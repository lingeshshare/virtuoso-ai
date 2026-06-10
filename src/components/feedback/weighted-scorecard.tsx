'use client'

import { cn } from '@/lib/utils/cn'
import type { RubricCategory } from '@/lib/constants/rubrics'

interface CategoryResult {
  id: string
  score: number
  observations: string[]
}

interface WeightedScorecardProps {
  rubric: RubricCategory[]
  results: CategoryResult[]
  personaWeights?: Record<string, number> // overrides rubric baseWeight if provided
  targetLevelBenchmarks?: Record<string, number> // target score per category id
  className?: string
}

function scoreColor(score: number): string {
  if (score >= 85) return 'text-emerald-400'
  if (score >= 70) return 'text-violet-300'
  if (score >= 55) return 'text-amber-400'
  return 'text-rose-400'
}

function barColor(score: number): string {
  if (score >= 85) return 'bg-emerald-500'
  if (score >= 70) return 'bg-violet-500'
  if (score >= 55) return 'bg-amber-500'
  return 'bg-rose-500'
}

function WeightPill({ weight, isPriority }: { weight: number; isPriority?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors',
        isPriority
          ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
          : 'bg-surface-overlay text-zinc-500 border border-border-subtle'
      )}
    >
      {Math.round(weight * 100)}%
    </span>
  )
}

export function WeightedScorecard({
  rubric,
  results,
  personaWeights,
  targetLevelBenchmarks,
  className,
}: WeightedScorecardProps) {
  const resultMap = Object.fromEntries(results.map((r) => [r.id, r]))

  // Compute weighted overall score
  let weightedSum = 0
  let totalWeight = 0
  for (const cat of rubric) {
    const w = personaWeights?.[cat.id] ?? cat.baseWeight
    const result = resultMap[cat.id]
    if (result) {
      weightedSum += result.score * w
      totalWeight += w
    }
  }
  const overallWeighted = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0

  return (
    <div className={cn('space-y-4', className)}>
      {/* Weighted overall */}
      <div className="flex items-center justify-between px-1 mb-5">
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Weighted Score</p>
          <p className="text-xs text-zinc-600 mt-0.5">Adjusted for instrument and persona emphasis</p>
        </div>
        <div className="text-right">
          <span className={cn('text-3xl font-black tabular-nums', scoreColor(overallWeighted))}>
            {overallWeighted}
          </span>
          <span className="text-zinc-500 text-sm">/100</span>
        </div>
      </div>

      {/* Category rows */}
      {rubric.map((cat) => {
        const result = resultMap[cat.id]
        const score = result?.score ?? 0
        const weight = personaWeights?.[cat.id] ?? cat.baseWeight
        const benchmark = targetLevelBenchmarks?.[cat.id]
        const gap = benchmark ? benchmark - score : null
        const isMaxWeight = weight === Math.max(...rubric.map((c) => personaWeights?.[c.id] ?? c.baseWeight))

        return (
          <div key={cat.id} className="group">
            {/* Label row */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-zinc-200">{cat.name}</span>
                <WeightPill weight={weight} isPriority={isMaxWeight} />
              </div>
              <div className="flex items-center gap-2">
                {benchmark !== undefined && gap !== null && (
                  <span
                    className={cn(
                      'text-[10px] font-medium',
                      gap <= 0 ? 'text-emerald-400' : gap <= 5 ? 'text-amber-400' : 'text-rose-400'
                    )}
                  >
                    {gap <= 0 ? '✓ At target' : `+${gap} needed`}
                  </span>
                )}
                <span className={cn('text-sm font-bold tabular-nums', scoreColor(score))}>
                  {score}/100
                </span>
              </div>
            </div>

            {/* Score bar */}
            <div className="relative h-1.5 w-full rounded-full bg-surface-overlay overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-700', barColor(score))}
                style={{ width: `${score}%` }}
              />
              {/* Target benchmark marker */}
              {benchmark !== undefined && (
                <div
                  className="absolute top-0 w-0.5 h-full bg-zinc-400/60 rounded-full"
                  style={{ left: `${benchmark}%` }}
                  title={`Target: ${benchmark}`}
                />
              )}
            </div>

            {/* Observations — show on first 3 only to keep it tight */}
            {result?.observations && (
              <div className="mt-1.5 space-y-0.5 pl-0.5">
                {result.observations.map((obs, i) => (
                  <p key={i} className="text-xs text-zinc-500 flex items-start gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-zinc-700 mt-1.5 flex-shrink-0" />
                    {obs}
                  </p>
                ))}
              </div>
            )}

            {/* Description on hover */}
            <p className="hidden group-hover:block text-[10px] text-zinc-600 mt-1 pl-0.5">
              {cat.description}
            </p>
          </div>
        )
      })}

      {/* Legend */}
      <div className="pt-3 border-t border-border-subtle flex items-center gap-4 text-[10px] text-zinc-600">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-1 bg-violet-500/50 rounded" />
          Persona weight
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-0.5 h-3 bg-zinc-400/60 rounded" />
          Target benchmark
        </span>
        <span>Weights adjust per persona</span>
      </div>
    </div>
  )
}
