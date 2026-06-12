'use client'

import { useState, useEffect } from 'react'
import { Loader2, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { Topbar } from '@/components/layout/topbar'
import { InstrumentGrid } from '@/components/onboarding/instrument-grid'
import { LevelSelector } from '@/components/onboarding/level-selector'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Instrument, PerformanceLevel } from '@/lib/types'

interface Profile {
  instrument: string | null
  current_level: string | null
  target_level: string | null
  email?: string
}

type Section = 'instrument' | 'current_level' | 'target_level'

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<Section | null>(null)
  const [saved, setSaved] = useState<Section | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState<Section | null>(null)

  // Staged changes — only committed on "Save"
  const [pendingInstrument, setPendingInstrument] = useState<string | null>(null)
  const [pendingCurrentLevel, setPendingCurrentLevel] = useState<string | null>(null)
  const [pendingTargetLevel, setPendingTargetLevel] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/user/profile')
      .then((r) => r.json())
      .then(({ profile: p, email: e }) => {
        setProfile(p)
        setEmail(e ?? null)
        setPendingInstrument(p?.instrument ?? null)
        setPendingCurrentLevel(p?.current_level ?? null)
        setPendingTargetLevel(p?.target_level ?? null)
      })
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false))
  }, [])

  async function save(section: Section, updates: Partial<Profile>) {
    setSaving(section)
    setError(null)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Save failed')
      }
      const { profile: updated } = await res.json()
      setProfile(updated)
      setSaved(section)
      setOpen(null)
      setTimeout(() => setSaved(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(null)
    }
  }

  function toggle(section: Section) {
    setOpen((prev) => (prev === section ? null : section))
  }

  if (loading) {
    return (
      <>
        <Topbar title="Settings" subtitle="Manage your profile" />
        <main className="flex-1 overflow-y-auto flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
        </main>
      </>
    )
  }

  return (
    <>
      <Topbar title="Settings" subtitle="Manage your profile and preferences" />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-4">

          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/8 border border-rose-500/20">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-rose-300">{error}</p>
            </div>
          )}

          {/* Account info */}
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Account</p>
              <p className="text-sm text-zinc-300">{email ?? '—'}</p>
            </CardContent>
          </Card>

          {/* Instrument */}
          <Card>
            <CardContent className="p-0">
              <button
                onClick={() => toggle('instrument')}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <div>
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1">Instrument</p>
                  <p className="text-sm text-white font-medium">{profile?.instrument ?? 'Not set'}</p>
                </div>
                <div className="flex items-center gap-2">
                  {saved === 'instrument' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {open === 'instrument' ? (
                    <ChevronUp className="w-4 h-4 text-zinc-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-500" />
                  )}
                </div>
              </button>

              {open === 'instrument' && (
                <div className="px-5 pb-5 space-y-4 border-t border-border-DEFAULT pt-4">
                  <InstrumentGrid
                    selected={pendingInstrument}
                    onSelect={(i: Instrument) => setPendingInstrument(i.id)}
                  />
                  <div className="flex items-center gap-3 pt-1">
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={saving === 'instrument' || pendingInstrument === profile?.instrument}
                      onClick={() => save('instrument', { instrument: pendingInstrument })}
                    >
                      {saving === 'instrument' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      Save Instrument
                    </Button>
                    <button
                      onClick={() => { setPendingInstrument(profile?.instrument ?? null); setOpen(null) }}
                      className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Level */}
          <Card>
            <CardContent className="p-0">
              <button
                onClick={() => toggle('current_level')}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <div>
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1">Current Level</p>
                  <p className="text-sm text-white font-medium capitalize">{profile?.current_level?.replace(/-/g, ' ') ?? 'Not set'}</p>
                </div>
                <div className="flex items-center gap-2">
                  {saved === 'current_level' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {open === 'current_level' ? (
                    <ChevronUp className="w-4 h-4 text-zinc-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-500" />
                  )}
                </div>
              </button>

              {open === 'current_level' && (
                <div className="px-5 pb-5 space-y-4 border-t border-border-DEFAULT pt-4">
                  <LevelSelector
                    selected={pendingCurrentLevel}
                    onSelect={(l: PerformanceLevel) => setPendingCurrentLevel(l.id)}
                  />
                  <div className="flex items-center gap-3 pt-1">
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={saving === 'current_level' || pendingCurrentLevel === profile?.current_level}
                      onClick={() => save('current_level', { current_level: pendingCurrentLevel })}
                    >
                      {saving === 'current_level' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      Save Level
                    </Button>
                    <button
                      onClick={() => { setPendingCurrentLevel(profile?.current_level ?? null); setOpen(null) }}
                      className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Goal Level */}
          <Card>
            <CardContent className="p-0">
              <button
                onClick={() => toggle('target_level')}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <div>
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1">Goal Level</p>
                  <p className="text-sm text-white font-medium capitalize">{profile?.target_level?.replace(/-/g, ' ') ?? 'Not set'}</p>
                </div>
                <div className="flex items-center gap-2">
                  {saved === 'target_level' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {open === 'target_level' ? (
                    <ChevronUp className="w-4 h-4 text-zinc-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-500" />
                  )}
                </div>
              </button>

              {open === 'target_level' && (
                <div className="px-5 pb-5 space-y-4 border-t border-border-DEFAULT pt-4">
                  <LevelSelector
                    selected={pendingTargetLevel}
                    onSelect={(l: PerformanceLevel) => setPendingTargetLevel(l.id)}
                  />
                  <div className="flex items-center gap-3 pt-1">
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={saving === 'target_level' || pendingTargetLevel === profile?.target_level}
                      onClick={() => save('target_level', { target_level: pendingTargetLevel })}
                    >
                      {saving === 'target_level' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      Save Goal
                    </Button>
                    <button
                      onClick={() => { setPendingTargetLevel(profile?.target_level ?? null); setOpen(null) }}
                      className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </main>
    </>
  )
}
