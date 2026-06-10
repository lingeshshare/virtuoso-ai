import { Skeleton } from '@/components/ui/skeleton'

export default function ProgressLoading() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="h-16 border-b border-zinc-800 px-6 flex items-center gap-3">
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-zinc-800 bg-surface-DEFAULT p-4 flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-10" />
                <Skeleton className="h-2.5 w-16" />
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-surface-DEFAULT p-6">
          <div className="flex justify-between mb-4">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-16" />
          </div>
          <div className="flex items-end gap-2.5 h-36">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="flex-1 rounded-t-md" style={{ height: `${40 + i * 8}%` }} />
            ))}
          </div>
        </div>
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-zinc-800 bg-surface-DEFAULT p-6 space-y-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
          <Skeleton className="rounded-2xl h-64" />
        </div>
      </div>
    </div>
  )
}
