import { cn } from '@/lib/utils/cn'

interface ProgressProps {
  value: number // 0–100
  max?: number
  className?: string
  trackClassName?: string
  fillClassName?: string
  size?: 'sm' | 'md' | 'lg'
  color?: 'violet' | 'emerald' | 'amber' | 'rose' | 'blue'
  animated?: boolean
  showValue?: boolean
  label?: string
}

const colorMap = {
  violet: 'bg-violet-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  blue: 'bg-blue-500',
}

const sizeMap = {
  sm: 'h-1',
  md: 'h-1.5',
  lg: 'h-2',
}

function Progress({
  value,
  max = 100,
  className,
  trackClassName,
  fillClassName,
  size = 'md',
  color = 'violet',
  animated = false,
  showValue = false,
  label,
}: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs text-zinc-400">{label}</span>}
          {showValue && <span className="text-xs font-medium text-zinc-300">{Math.round(pct)}%</span>}
        </div>
      )}
      <div
        className={cn(
          'w-full rounded-full bg-surface-overlay overflow-hidden',
          sizeMap[size],
          trackClassName
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out',
            colorMap[color],
            animated && 'animate-shimmer bg-[length:200%_100%]',
            fillClassName
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// Score-specific variant that auto-colors based on value
function ScoreBar({ score, max = 100, label }: { score: number; max?: number; label?: string }) {
  const pct = (score / max) * 100
  const color =
    pct >= 80 ? 'emerald' : pct >= 60 ? 'violet' : pct >= 40 ? 'amber' : 'rose'

  return <Progress value={score} max={max} color={color} size="lg" showValue label={label} />
}

export { Progress, ScoreBar }
