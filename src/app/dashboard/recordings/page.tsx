import type { Metadata } from 'next'
import Link from 'next/link'
import { Mic } from 'lucide-react'
import { Topbar } from '@/components/layout/topbar'
import { RecordingCard } from '@/components/dashboard/recording-card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Recordings' }

const MOCK_RECORDINGS = [
  { id: 'demo-1', instrument: 'Alto Saxophone', title: 'All-State Audition Excerpt', date: '2026-06-06', duration: '4:32', score: 74, level: 'Region', status: 'analyzed' as const },
  { id: 'demo-2', instrument: 'Alto Saxophone', title: 'Concerto in E♭ Major, Mvt. I', date: '2026-06-04', duration: '6:18', score: 71, level: 'Region', status: 'analyzed' as const },
  { id: 'demo-3', instrument: 'Alto Saxophone', title: 'Scale Packet — E Major', date: '2026-06-02', duration: '2:15', score: 82, level: 'Advanced', status: 'analyzed' as const },
  { id: 'demo-4', instrument: 'Alto Saxophone', title: 'Sight Reading Exercise #4', date: '2026-05-28', duration: '3:40', score: 66, level: 'Region', status: 'analyzed' as const },
  { id: 'demo-5', instrument: 'Alto Saxophone', title: 'Long-tone Routine', date: '2026-05-25', duration: '8:12', score: 79, level: 'Advanced', status: 'analyzed' as const },
]

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatDate(ts: string): string {
  return new Date(ts).toISOString().split('T')[0]
}

export default async function RecordingsPage() {
  // Try to load real recordings from Supabase
  let recordings: typeof MOCK_RECORDINGS = []
  let isDemo = false

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      isDemo = true
      recordings = MOCK_RECORDINGS
    } else {
      const { data, error } = await supabase
        .from('recordings')
        .select(`
          id, title, instrument, duration_seconds, status, created_at, error_message,
          feedback_reports (overall_score, estimated_level)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error || !data) {
        isDemo = true
        recordings = MOCK_RECORDINGS
      } else if (data.length === 0) {
        recordings = []
      } else {
        // Map DB rows to RecordingCard props
        recordings = data.map((r) => {
          const report = Array.isArray(r.feedback_reports)
            ? r.feedback_reports[0]
            : r.feedback_reports

          return {
            id: r.id,
            instrument: r.instrument,
            title: r.title,
            date: formatDate(r.created_at),
            duration: formatDuration(r.duration_seconds),
            score: report?.overall_score ?? null,
            level: report?.estimated_level ?? null,
            status: r.status as 'analyzed' | 'processing' | 'error' | 'uploading',
          }
        })
      }
    }
  } catch {
    isDemo = true
    recordings = MOCK_RECORDINGS
  }

  return (
    <>
      <Topbar
        title="Recordings"
        subtitle={
          isDemo
            ? 'Demo mode — sign in to save recordings'
            : `${recordings.length} session${recordings.length !== 1 ? 's' : ''}`
        }
        actions={
          <Link href="/dashboard/upload">
            <Button variant="primary" size="sm">
              <Mic className="w-3.5 h-3.5" />
              New recording
            </Button>
          </Link>
        }
      />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-3">
          {recordings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-14 h-14 rounded-2xl bg-surface-overlay flex items-center justify-center mb-4">
                <Mic className="w-6 h-6 text-zinc-500" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">No recordings yet</h3>
              <p className="text-sm text-zinc-500 max-w-sm mb-6">
                Upload an audio file to get your first AI-powered feedback report.
              </p>
              <Link href="/dashboard/upload">
                <Button variant="primary">Upload a Recording</Button>
              </Link>
            </div>
          ) : (
            recordings.map((r) => <RecordingCard key={r.id} {...r} />)
          )}
        </div>
      </main>
    </>
  )
}
