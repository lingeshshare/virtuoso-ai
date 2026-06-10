import { Skeleton } from '@/components/ui/skeleton'

export default function UploadLoading() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="h-16 border-b border-zinc-800 px-6 flex items-center">
        <Skeleton className="h-4 w-36" />
      </div>
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-4">
        <Skeleton className="h-56 w-full rounded-2xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    </div>
  )
}
