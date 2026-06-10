import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Handles Supabase Auth email confirmation and OAuth redirects.
// Supabase redirects here after: email link click, magic link, OAuth.
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Surface auth errors back to the UI
  if (error) {
    const url = new URL('/auth/login', origin)
    url.searchParams.set('error', error)
    url.searchParams.set('error_description', errorDescription ?? '')
    return NextResponse.redirect(url)
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      const url = new URL('/auth/login', origin)
      url.searchParams.set('error', 'exchange_failed')
      url.searchParams.set('error_description', exchangeError.message)
      return NextResponse.redirect(url)
    }
  }

  // Redirect to the intended destination
  const redirectUrl = next.startsWith('/') ? `${origin}${next}` : origin + '/dashboard'
  return NextResponse.redirect(redirectUrl)
}
