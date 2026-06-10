import { Skeleton } from '@/components/ui/skeleton'

export default function PracticeLoading() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="h-16 border-b border-zinc-800 px-6 flex items-center">
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-zinc-800 bg-surface-DEFAULT p-5 space-y-3">
            <div className="flex items-start gap-3">
              <Skeleton className="w-5 h-5 rounded mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
