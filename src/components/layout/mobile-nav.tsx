'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Mic, FileAudio, TrendingUp, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const MOBILE_NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/dashboard/recordings', icon: FileAudio, label: 'Recordings' },
  { href: '/dashboard/upload', icon: Mic, label: 'Record' },
  { href: '/dashboard/practice', icon: ClipboardList, label: 'Practice' },
  { href: '/dashboard/progress', icon: TrendingUp, label: 'Progress' },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-base-900/95 backdrop-blur-sm border-t border-zinc-800 flex md:hidden safe-area-inset-bottom">
      {MOBILE_NAV.map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
        const isRecord = href === '/dashboard/upload'
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors min-h-[56px]',
              isRecord
                ? 'text-white'
                : isActive
                ? 'text-violet-400'
                : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            {isRecord ? (
              <div className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center shadow-glow-violet -mt-5 mb-0.5">
                <Icon className="w-5 h-5 text-white" />
              </div>
            ) : (
              <Icon className="w-5 h-5" />
            )}
            <span className={cn('text-[10px] font-medium', isRecord && 'text-violet-400')}>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
