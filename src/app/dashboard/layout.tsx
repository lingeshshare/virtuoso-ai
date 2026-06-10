import { Sidebar } from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-base-900">
      {/* Sidebar: desktop only */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main content — add bottom padding on mobile for nav bar */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden pb-14 md:pb-0">
        {children}
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  )
}
