import Link from 'next/link'
import { FileAudio, ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function RecordingNotFound() {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <FileAudio className="w-6 h-6 text-zinc-500" />
          </div>
          <h2 className="text-base font-semibold text-white mb-2">Recording not found</h2>
          <p className="text-sm text-zinc-400 mb-6">
            This recording doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <Link
            href="/dashboard/recordings"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            All recordings
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
