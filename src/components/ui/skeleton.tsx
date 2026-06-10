import { cn } from '@/lib/utils/cn'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-zinc-800/60', className)}
    />
  )
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn('rounded-2xl border border-zinc-800 bg-surface-DEFAULT p-5 space-y-3', className)}>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  )
}

export function SkeletonRecordingCard() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-surface-DEFAULT p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-10 w-10 rounded-xl flex-shrink-0" />
      </div>
      <div className="space-y-2 mt-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-2.5 w-20 rounded-full" />
          <Skeleton className="h-2 flex-1 rounded-full" />
          <Skeleton className="h-3 w-8" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-2.5 w-20 rounded-full" />
          <Skeleton className="h-2 flex-1 rounded-full" />
          <Skeleton className="h-3 w-8" />
        </div>
      </div>
    </div>
  )
}
