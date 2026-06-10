import { cn } from '@/lib/utils/cn'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'bordered' | 'ghost'
  interactive?: boolean
  selected?: boolean
}

function Card({
  className,
  variant = 'default',
  interactive = false,
  selected = false,
  children,
  ...props
}: CardProps) {
  const base = 'rounded-2xl transition-all duration-200'

  const variants = {
    default: 'bg-surface-DEFAULT border border-border-DEFAULT shadow-card',
    elevated: 'bg-surface-raised border border-border-DEFAULT shadow-card',
    bordered: 'bg-transparent border border-border-strong',
    ghost: 'bg-transparent',
  }

  const interactiveStyles = interactive
    ? 'cursor-pointer hover:border-violet-500/40 hover:-translate-y-0.5 hover:shadow-glow-violet active:translate-y-0'
    : ''

  const selectedStyles = selected
    ? 'border-violet-500 bg-violet-950/20 shadow-glow-violet'
    : ''

  return (
    <div
      className={cn(base, variants[variant], interactiveStyles, selectedStyles, className)}
      {...props}
    >
      {children}
    </div>
  )
}

function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-5 pb-0', className)} {...props}>
      {children}
    </div>
  )
}

function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-5', className)} {...props}>
      {children}
    </div>
  )
}

function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('px-5 py-4 border-t border-border-subtle flex items-center', className)}
      {...props}
    >
      {children}
    </div>
  )
}

function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-base font-semibold text-white leading-none', className)} {...props}>
      {children}
    </h3>
  )
}

function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-zinc-400 mt-1', className)} {...props}>
      {children}
    </p>
  )
}

export { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription }
