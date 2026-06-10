'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Mic,
  FileAudio,
  TrendingUp,
  ClipboardList,
  User,
  Music,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/upload', icon: Mic, label: 'New Recording' },
  { href: '/dashboard/recordings', icon: FileAudio, label: 'Recordings' },
  { href: '/dashboard/practice', icon: ClipboardList, label: 'Practice Plans' },
  { href: '/dashboard/progress', icon: TrendingUp, label: 'Progress' },
  { href: '/dashboard/profile', icon: User, label: 'Profile' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col border-r border-border-DEFAULT bg-base-900 min-h-screen">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-border-DEFAULT">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-glow-violet flex-shrink-0">
            <Music className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-white tracking-tight">Virtuoso AI</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                isActive
                  ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-surface-raised'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 flex-shrink-0 transition-colors',
                  isActive ? 'text-violet-400' : 'text-zinc-500 group-hover:text-zinc-300'
                )}
              />
              {label}
              {isActive && <ChevronRight className="w-3 h-3 ml-auto text-violet-400/60" />}
            </Link>
          )
        })}
      </nav>

      {/* New Recording CTA */}
      <div className="px-3 py-4 border-t border-border-DEFAULT">
        <Link
          href="/dashboard/upload"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-violet-500 hover:bg-violet-400 text-white text-sm font-semibold transition-all shadow-glow-violet hover:shadow-glow-violet-lg"
        >
          <Mic className="w-4 h-4" />
          Record Now
        </Link>
      </div>
    </aside>
  )
}
