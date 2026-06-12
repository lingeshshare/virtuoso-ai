'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface RecordingStatusPollerProps {
  recordingId: string
  pollIntervalMs?: number
}

type Status = 'uploading' | 'processing' | 'analyzed' | 'error'

export function RecordingStatusPoller({
  recordingId,
  pollIntervalMs = 3000,
}: RecordingStatusPollerProps) {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('processing')
  const [elapsed, setElapsed] = useState(0)
  const [hasReport, setHasReport] = useState(false)
  const [dots, setDots] = useState('.')
  const startTimeRef = useRef(Date.now())

  useEffect(() => {
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '.' : d + '.'))
    }, 500)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    let stopped = false

    const poll = async () => {
      try {
        const res = await fetch(`/api/recordings/${recordingId}`)
        if (!res.ok) return

        const { recording } = await res.json()
        if (!recording) return

        const newStatus: Status = recording.status
        setStatus(newStatus)

        // Check if coaching report already generated
        const reports = Array.isArray(recording.feedback_reports)
          ? recording.feedback_reports
          : recording.feedback_reports
          ? [recording.feedback_reports]
          : []
        const reportDone = reports.length > 0
        setHasReport(reportDone)

        if (newStatus === 'error') {
          stopped = true
          router.refresh()
          return
        }

        // Refresh as soon as analysis is done + coaching is done (or give up waiting for coaching after 90s)
        const secondsSinceStart = (Date.now() - startTimeRef.current) / 1000
        if (newStatus === 'analyzed' && (reportDone || secondsSinceStart >= 90)) {
          stopped = true
          router.refresh()
        }
      } catch {
        // Network error — keep polling
      }
    }

    const id = setInterval(() => {
      if (!stopped) poll()
    }, pollIntervalMs)

    poll()

    return () => {
      stopped = true
      clearInterval(id)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordingId, pollIntervalMs, router])

  const stage =
    status === 'uploading' ? 1
    : status === 'processing' ? 2
    : hasReport ? 4
    : 3

  const stages = [
    { label: 'Upload complete', done: stage > 1 },
    { label: 'Audio analysis', done: stage > 2 },
    { label: 'AI coaching report', done: stage > 3 },
  ]

  const statusLabel =
    status === 'uploading' ? 'Uploading'
    : status === 'processing' ? 'Analyzing audio'
    : stage === 3 ? 'Generating coaching feedback'
    : 'Ready'

  return (
    <div className="rounded-2xl border border-border-DEFAULT bg-surface-DEFAULT p-6">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0">
          {status === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-400" />
          ) : (
            <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white mb-0.5">
            {statusLabel}{dots}
          </p>
          <p className="text-xs text-zinc-500">
            {elapsed}s
            {elapsed > 25 && status === 'processing' && (
              <span className="ml-2 text-zinc-600">— audio service may be warming up</span>
            )}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-2.5">
        {stages.map((s, i) => {
          const isActive = i + 1 === stage
          return (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                s.done ? 'bg-emerald-500/20' : isActive ? 'bg-violet-500/20' : 'bg-surface-overlay'
              }`}>
                {s.done ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : isActive ? (
                  <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                )}
              </div>
              <span className={`text-xs ${
                s.done ? 'text-emerald-400' : isActive ? 'text-violet-300' : 'text-zinc-600'
              }`}>
                {s.label}
              </span>
            </div>
          )
        })}
      </div>

      {status === 'error' && (
        <div className="mt-4 flex items-center gap-2 text-xs text-rose-400">
          <AlertCircle className="w-3.5 h-3.5" />
          Analysis failed. Check the details below.
        </div>
      )}
    </div>
  )
}
