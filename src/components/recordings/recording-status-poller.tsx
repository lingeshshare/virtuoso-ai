'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface RecordingStatusPollerProps {
  recordingId: string
  pollIntervalMs?: number
}

type Status = 'uploading' | 'processing' | 'analyzed' | 'error'

export function RecordingStatusPoller({
  recordingId,
  pollIntervalMs = 2000,
}: RecordingStatusPollerProps) {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('processing')
  const [elapsed, setElapsed] = useState(0)
  const [dots, setDots] = useState('.')

  // Animate dots
  useEffect(() => {
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '.' : d + '.'))
    }, 500)
    return () => clearInterval(id)
  }, [])

  // Elapsed timer
  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(id)
  }, [])

  // Poll recording status
  useEffect(() => {
    let stopped = false

    const poll = async () => {
      try {
        const res = await fetch(`/api/recordings/${recordingId}`)
        if (!res.ok) return

        const { recording } = await res.json()
        if (!recording) return

        setStatus(recording.status)

        if (recording.status === 'analyzed' || recording.status === 'error') {
          stopped = true
          // Reload the page to show the new state
          router.refresh()
        }
      } catch {
        // Network error — keep polling
      }
    }

    const id = setInterval(() => {
      if (!stopped) poll()
    }, pollIntervalMs)

    // Initial poll immediately
    poll()

    return () => {
      stopped = true
      clearInterval(id)
    }
  }, [recordingId, pollIntervalMs, router])

  const statusMessages: Record<Status, string> = {
    uploading: 'Uploading audio file',
    processing: 'Analyzing audio',
    analyzed: 'Analysis complete',
    error: 'Analysis failed',
  }

  const stage = status === 'uploading' ? 1 : status === 'processing' ? 2 : 3
  const stages = [
    { label: 'Upload', done: stage > 1 },
    { label: 'Audio analysis', done: stage > 2 },
    { label: 'Feedback ready', done: stage > 2 },
  ]

  return (
    <div className="rounded-2xl border border-border-DEFAULT bg-surface-DEFAULT p-6">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0">
          <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white mb-0.5">
            {statusMessages[status]}{dots}
          </p>
          <p className="text-xs text-zinc-500">{elapsed}s elapsed</p>
        </div>
      </div>

      {/* Stage progress */}
      <div className="mt-5 space-y-2.5">
        {stages.map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
              s.done ? 'bg-emerald-500/20' : i + 1 === stage ? 'bg-violet-500/20' : 'bg-surface-overlay'
            }`}>
              {s.done ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : i + 1 === stage ? (
                <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
              )}
            </div>
            <span className={`text-xs ${
              s.done ? 'text-emerald-400' : i + 1 === stage ? 'text-violet-300' : 'text-zinc-600'
            }`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {status === 'error' && (
        <div className="mt-4 flex items-center gap-2 text-xs text-rose-400">
          <AlertCircle className="w-3.5 h-3.5" />
          Analysis failed. The error will be shown below.
        </div>
      )}
    </div>
  )
}
