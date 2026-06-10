import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/supabase/types'

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function fetchProfile(): Promise<Profile | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // profile not yet created
    throw new Error(error.message)
  }
  return data
}

export async function upsertProfile(updates: {
  instrument?: string
  current_level?: string
  target_level?: string
  onboarding_completed?: boolean
}): Promise<void> {
  const res = await fetch('/api/user/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Update failed' }))
    throw new Error(body.error ?? 'Profile update failed')
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
}

export async function getCurrentUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
