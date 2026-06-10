'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const base =
      'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-base-900 disabled:pointer-events-none disabled:opacity-50 rounded-xl select-none'

    const variants = {
      primary:
        'bg-violet-500 text-white hover:bg-violet-400 shadow-glow-violet hover:shadow-glow-violet-lg active:scale-[0.98]',
      secondary:
        'bg-surface-raised text-white hover:bg-surface-overlay border border-border-DEFAULT hover:border-border-strong active:scale-[0.98]',
      ghost:
        'text-zinc-400 hover:text-white hover:bg-surface-raised active:scale-[0.98]',
      outline:
        'border border-border-strong text-zinc-300 hover:border-violet-500/50 hover:text-white active:scale-[0.98]',
      destructive:
        'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 active:scale-[0.98]',
    }

    const sizes = {
      sm: 'text-xs px-3 py-1.5 h-7',
      md: 'text-sm px-4 py-2 h-9',
      lg: 'text-sm px-6 py-2.5 h-10',
      xl: 'text-base px-8 py-3.5 h-12',
    }

    return (
      <button
        ref={ref}
        className={cn(
          base,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>{children}</span>
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
