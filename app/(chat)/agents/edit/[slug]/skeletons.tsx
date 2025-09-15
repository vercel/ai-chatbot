import { Skeleton } from '@/components/ui/skeleton';

export function EditAgentPageSkeleton() {
  return (
    <div className="flex flex-1 flex-col h-full">
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-6 max-w-2xl">
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-3 w-56" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-10 rounded-full" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </div>
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
