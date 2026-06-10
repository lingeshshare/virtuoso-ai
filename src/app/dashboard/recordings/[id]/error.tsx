'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function RecordingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[recording-detail]', error)
  }, [error])

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-500/15 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-rose-400" />
          </div>
          <h2 className="text-base font-semibold text-white mb-2">Recording not available</h2>
          <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
            {error.message || 'This recording could not be loaded.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
            <Link
              href="/dashboard/recordings"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white text-sm font-medium transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              All recordings
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
