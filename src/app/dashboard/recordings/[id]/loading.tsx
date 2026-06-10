import { Skeleton } from '@/components/ui/skeleton'

export default function RecordingDetailLoading() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="h-16 border-b border-zinc-800 px-6 flex items-center gap-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-5">
        {/* Score card skeleton */}
        <div className="rounded-2xl border border-zinc-800 bg-surface-DEFAULT p-6">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0 space-y-1.5">
              <Skeleton className="h-16 w-16" />
              <Skeleton className="h-2.5 w-16" />
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-5 w-28 rounded-full" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
          <div className="mt-5 space-y-3 pt-5 border-t border-zinc-800">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-3 w-28 rounded-full" />
                <Skeleton className="h-2 flex-1 rounded-full" />
                <Skeleton className="h-3 w-8" />
              </div>
            ))}
          </div>
        </div>

        {/* Nav card grid skeleton */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-zinc-800 bg-surface-DEFAULT p-5 space-y-3">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
