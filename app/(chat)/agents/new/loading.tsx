import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingNewAgentPage() {
  return (
    <div className="flex flex-1 flex-col h-full">
      {/* Header skeleton */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
      </div>

      {/* Two-column layout skeleton */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: form skeleton */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-6 max-w-2xl">
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-3 w-64" />
            </div>

            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-10 rounded-full" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </div>

        {/* Right: live preview skeleton (hidden on small screens) */}
        <div className="hidden md:block flex-1 border-l bg-muted/20 p-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </div>
    </div>
  );
}

