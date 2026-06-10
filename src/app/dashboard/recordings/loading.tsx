import { Skeleton, SkeletonRecordingCard } from '@/components/ui/skeleton'

export default function RecordingsLoading() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="h-16 border-b border-zinc-800 px-6 flex items-center gap-3">
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonRecordingCard key={i} />
        ))}
      </div>
    </div>
  )
}
