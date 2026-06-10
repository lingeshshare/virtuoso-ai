import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)

  const path = request.nextUrl.pathname
  const isDashboard = path.startsWith('/dashboard')
  const isAuthPage = path.startsWith('/auth') && !path.startsWith('/auth/callback')
  const isRoot = path === '/'

  // Root: authenticated → dashboard, unauthenticated → login
  if (isRoot && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    if (user) return NextResponse.redirect(new URL('/dashboard', request.url))
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Protect dashboard routes — redirect unauthenticated users to login
  if (isDashboard && !user && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect logged-in users away from auth pages
  if (isAuthPage && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files, images, and favicon.
     * This allows the session cookie to be refreshed on every navigation.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
