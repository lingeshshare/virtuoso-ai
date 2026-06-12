'use client'

import Link from 'next/link'
import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface TopbarProps {
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
}

export function Topbar({ title, subtitle, actions, className }: TopbarProps) {
  return (
    <header
      className={cn(
        'h-16 flex items-center justify-between px-4 sm:px-6 border-b border-border-DEFAULT bg-base-900 flex-shrink-0',
        className
      )}
    >
      <div className="min-w-0 flex-1 mr-3">
        {title && (
          <h1 className="text-sm sm:text-base font-semibold text-white leading-none truncate">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="text-[11px] sm:text-xs text-zinc-500 mt-0.5 truncate">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {actions}

        <button className="hidden sm:flex w-8 h-8 rounded-lg items-center justify-center text-zinc-400 hover:text-white hover:bg-surface-raised transition-all">
          <Bell className="w-4 h-4" />
        </button>

        <Link
          href="/dashboard/settings"
          className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-xs font-semibold text-white shadow-glow-violet select-none flex-shrink-0 hover:opacity-80 transition-opacity"
        >
          V
        </Link>
      </div>
    </header>
  )
}
