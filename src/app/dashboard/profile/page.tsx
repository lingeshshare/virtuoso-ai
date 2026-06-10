import type { Metadata } from 'next'
import Link from 'next/link'
import { LogOut, Shield } from 'lucide-react'
import { Topbar } from '@/components/layout/topbar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { getInstrumentById } from '@/lib/constants/instruments'
import { getLevelById } from '@/lib/constants/levels'

export const metadata: Metadata = { title: 'Profile' }

export default async function ProfilePage() {
  let instrumentLabel = '—'
  let instrumentEmoji = '🎵'
  let currentLevelLabel = '—'
  let targetLevelLabel = '—'
  let email = ''
  let memberSince = ''
  let isLoggedIn = false

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      isLoggedIn = true
      email = user.email ?? ''
      memberSince = new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })

      const { data: profile } = await supabase
        .from('profiles')
        .select('instrument, current_level, target_level')
        .eq('id', user.id)
        .single()

      if (profile?.instrument) {
        const inst = getInstrumentById(profile.instrument)
        if (inst) {
          instrumentLabel = inst.label
          instrumentEmoji = inst.emoji
        }
      }
      if (profile?.current_level) {
        currentLevelLabel = getLevelById(profile.current_level)?.label ?? profile.current_level
      }
      if (profile?.target_level) {
        targetLevelLabel = getLevelById(profile.target_level)?.label ?? profile.target_level
      }
    }
  } catch {
    // fall through
  }

  return (
    <>
      <Topbar title="Profile" subtitle="Your instrument and goals" />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-6 py-8 space-y-4">

          {/* Instrument & level card */}
          <Card>
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-2xl shadow-glow-violet">
                  {instrumentEmoji}
                </div>
                <div>
                  <p className="text-base font-bold text-white">{instrumentLabel}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Primary instrument</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-surface-raised border border-border-DEFAULT">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">Current Level</p>
                  <p className="text-sm font-semibold text-amber-400">{currentLevelLabel}</p>
                </div>
                <div className="p-3 rounded-xl bg-surface-raised border border-border-DEFAULT">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">Target Level</p>
                  <p className="text-sm font-semibold text-violet-400">{targetLevelLabel}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-border-subtle">
                <Link href="/onboarding">
                  <Button variant="secondary" size="md" fullWidth>
                    Update instrument & goals
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Account card */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Account</p>

              {isLoggedIn ? (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Email</span>
                    <span className="text-zinc-300 font-medium truncate max-w-[200px]">{email}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Member since</span>
                    <span className="text-zinc-300">{memberSince}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Auth</span>
                    <Badge variant="emerald" dot>Active</Badge>
                  </div>
                  <div className="pt-3 border-t border-border-subtle flex items-center gap-3">
                    <Link
                      href="/auth/signout"
                      className="flex items-center gap-2 text-sm text-zinc-400 hover:text-rose-400 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Auth</span>
                    <Badge variant="default">Not signed in</Badge>
                  </div>
                  <div className="pt-2">
                    <Link href="/auth/login">
                      <Button variant="secondary" size="sm">Sign in</Button>
                    </Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Privacy card */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-zinc-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-zinc-400 mb-1">Privacy</p>
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Recordings are stored privately in your account. Audio is processed by the analysis service and then used only to generate your feedback. No recordings are shared.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
