import { forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  prefix?: React.ReactNode
  suffix?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, prefix, suffix, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">{label}</label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <div className="absolute left-3 text-zinc-400 pointer-events-none">{prefix}</div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full bg-surface-DEFAULT border border-border-DEFAULT rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600',
              'transition-all duration-200',
              'focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/40',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/40',
              prefix && 'pl-9',
              suffix && 'pr-9',
              className
            )}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3 text-zinc-400 pointer-events-none">{suffix}</div>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-zinc-500">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
