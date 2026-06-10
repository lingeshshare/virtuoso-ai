import { cn } from '@/lib/utils/cn'

type BadgeVariant =
  | 'default'
  | 'violet'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'blue'
  | 'outline'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  dot?: boolean
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-surface-overlay text-zinc-300 border border-border-DEFAULT',
  violet: 'bg-violet-500/15 text-violet-300 border border-violet-500/25',
  emerald: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
  amber: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
  rose: 'bg-rose-500/15 text-rose-400 border border-rose-500/25',
  blue: 'bg-blue-500/15 text-blue-400 border border-blue-500/25',
  outline: 'border border-border-strong text-zinc-400',
}

function Badge({ className, variant = 'default', dot = false, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full', {
            'bg-violet-400': variant === 'violet',
            'bg-emerald-400': variant === 'emerald',
            'bg-amber-400': variant === 'amber',
            'bg-rose-400': variant === 'rose',
            'bg-blue-400': variant === 'blue',
            'bg-zinc-400': variant === 'default' || variant === 'outline',
          })}
        />
      )}
      {children}
    </span>
  )
}

export { Badge }
