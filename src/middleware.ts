import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)

  const path = request.nextUrl.pathname
  const isDashboard = path.startsWith('/dashboard')
  const isAuthPage = path.startsWith('/auth') && !path.startsWith('/auth/callback')
  const isRoot = path === '/'
  const isOnboarding = path === '/onboarding'

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return supabaseResponse

  // Root: authenticated → dashboard or onboarding, unauthenticated → login
  if (isRoot) {
    if (!user) return NextResponse.redirect(new URL('/auth/login', request.url))
    if (!user.user_metadata?.onboarded) return NextResponse.redirect(new URL('/onboarding', request.url))
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Protect dashboard — unauthenticated → login
  if (isDashboard && !user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated but not onboarded — force onboarding before dashboard
  if (isDashboard && user && !user.user_metadata?.onboarded && !isOnboarding) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // Redirect logged-in + onboarded users away from auth pages
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
