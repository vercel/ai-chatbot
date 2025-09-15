import { SidebarPageHeader } from '@/components/sidebar-page-header';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingAgentsPage() {
  return (
    <>
      <SidebarPageHeader />
      <div className="container mx-auto px-4 md:px-12 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2 min-w-0">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-5 w-80 max-w-full" />
            </div>
            <Skeleton className="h-9 w-32" />
          </div>
        </div>

        {/* My Agents section skeleton */}
        <div className="mb-12 space-y-4">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-5 w-72 max-w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={`my-agent-${i + 1}`} className="space-y-3">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>

        {/* Community Agents section skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-5 w-80 max-w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={`community-agent-${i + 1}`} className="space-y-3">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
