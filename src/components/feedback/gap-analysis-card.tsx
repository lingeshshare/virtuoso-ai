import { ArrowRight, Clock } from 'lucide-react'
import { PERFORMANCE_LEVELS, getLevelById } from '@/lib/constants/levels'
import { cn } from '@/lib/utils/cn'

interface DimensionGap {
  label: string
  currentScore: number
  targetScore: number
}

interface GapAnalysisCardProps {
  currentLevelId: string
  targetLevelId: string
  gaps: DimensionGap[]
  estimatedWeeks?: number
  className?: string
}

function LevelBar({ currentId, targetId }: { currentId: string; targetId: string }) {
  const current = getLevelById(currentId)
  const target = getLevelById(targetId)
  if (!current || !target) return null

  const totalLevels = PERFORMANCE_LEVELS.length

  return (
    <div className="relative">
      {/* Track */}
      <div className="flex items-center gap-0.5 h-2">
        {PERFORMANCE_LEVELS.map((level) => {
          const isCurrent = level.id === currentId
          const isTarget = level.id === targetId
          const isBetween = level.rank > current.rank && level.rank < target.rank
          const isPast = level.rank < current.rank

          return (
            <div
              key={level.id}
              className={cn(
                'flex-1 h-full rounded-sm transition-colors',
                isCurrent ? 'bg-amber-500' : isTarget ? 'bg-violet-500' : isBetween ? 'bg-violet-500/30' : isPast ? 'bg-emerald-500/40' : 'bg-surface-overlay'
              )}
            />
          )
        })}
      </div>

      {/* Labels */}
      <div className="relative mt-2" style={{ height: '30px' }}>
        {PERFORMANCE_LEVELS.map((level) => {
          const isCurrent = level.id === currentId
          const isTarget = level.id === targetId
          if (!isCurrent && !isTarget) return null

          const pct = ((level.rank - 1) / (totalLevels - 1)) * 100

          return (
            <div
              key={level.id}
              className="absolute flex flex-col items-center"
              style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
            >
              <div
                className={cn(
                  'w-2.5 h-2.5 rounded-full border-2',
                  isCurrent
                    ? 'bg-amber-500 border-amber-400'
                    : 'bg-violet-500 border-violet-400'
                )}
              />
              <span
                className={cn(
                  'text-[9px] font-semibold mt-1 whitespace-nowrap',
                  isCurrent ? 'text-amber-400' : 'text-violet-400'
                )}
              >
                {level.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function GapAnalysisCard({
  currentLevelId,
  targetLevelId,
  gaps,
  estimatedWeeks,
  className,
}: GapAnalysisCardProps) {
  const current = getLevelById(currentLevelId)
  const target = getLevelById(targetLevelId)

  if (!current || !target) return null

  const levelGap = target.rank - current.rank

  return (
    <div className={cn('space-y-5', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold" style={{ color: current.textColor }}>{current.label}</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-600" />
            <span className="text-sm font-semibold" style={{ color: target.textColor }}>{target.label}</span>
          </div>
          <p className="text-xs text-zinc-500">{levelGap} level{levelGap !== 1 ? 's' : ''} to close</p>
        </div>
        {estimatedWeeks && (
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span>~{estimatedWeeks} weeks</span>
          </div>
        )}
      </div>

      {/* Level progress bar */}
      <LevelBar currentId={currentLevelId} targetId={targetLevelId} />

      {/* Per-dimension gaps */}
      <div className="space-y-2.5 pt-1">
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
          Gap by dimension
        </p>
        {gaps.map((gap) => {
          const delta = gap.targetScore - gap.currentScore
          const pctCurrent = gap.currentScore
          const pctTarget = gap.targetScore
          const isAtTarget = delta <= 0

          return (
            <div key={gap.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-zinc-300">{gap.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500 tabular-nums">{gap.currentScore}</span>
                  {!isAtTarget && (
                    <>
                      <ArrowRight className="w-2.5 h-2.5 text-zinc-600" />
                      <span className="text-[10px] text-zinc-500 tabular-nums">{gap.targetScore}</span>
                      <span
                        className={cn(
                          'text-[10px] font-bold',
                          delta > 10 ? 'text-rose-400' : delta > 5 ? 'text-amber-400' : 'text-emerald-400'
                        )}
                      >
                        +{delta}
                      </span>
                    </>
                  )}
                  {isAtTarget && <span className="text-[10px] font-medium text-emerald-400">✓</span>}
                </div>
              </div>

              {/* Stacked bar: current (solid) + gap to target (dashed) */}
              <div className="relative h-1.5 w-full rounded-full bg-surface-overlay overflow-hidden">
                {/* Current score */}
                <div
                  className={cn(
                    'absolute h-full rounded-full',
                    isAtTarget ? 'bg-emerald-500' : gap.currentScore >= 80 ? 'bg-violet-500' : gap.currentScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                  )}
                  style={{ width: `${pctCurrent}%` }}
                />
                {/* Target marker */}
                {!isAtTarget && (
                  <div
                    className="absolute top-0 w-0.5 h-full bg-zinc-400/50"
                    style={{ left: `${pctTarget}%` }}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
