/**
 * @file app/(main)/artifacts/page.tsx
 * @description Страница для отображения и управления всеми артефактами пользователя.
 * @version 2.0.0
 * @date 2025-06-09
 * @updated Переименован "Контент" в "Артефакты", обновлены компоненты.
 */

/** HISTORY:
 * v2.0.0 (2025-06-09): Переименовано в "Артефакты".
 * v1.0.1 (2025-06-06): Исправлена проблема с key в цикле.
 */
'use client'

import { Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { ArtifactGridClientWrapper } from '@/components/artifact-grid-client-wrapper'
import { Skeleton } from '@/components/ui/skeleton'

const skeletonKeys = Array.from({ length: 8 }, (_, i) => `sk-${i}`)

export default function ArtifactsPage ({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { data: session, status } = useSession()
  const openArtifactId = searchParams?.openArtifactId as string | undefined

  if (status === 'loading') {
    return <GridSkeleton/>
  }

  if (!session?.user?.id) {
    redirect('/login')
  }

  return (
    <div className="flex h-full">
      <div className="container mx-auto py-10 px-4 md:px-6 lg:px-8 flex-1">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Мои Артефакты
          </h1>
          <p className="text-muted-foreground">
            Здесь вы можете управлять всеми вашими артефактами: текстами, кодом и другими материалами.
          </p>
        </header>

        <Suspense fallback={<GridSkeleton/>}>
          <ArtifactGridClientWrapper userId={session.user.id} openArtifactId={openArtifactId}/>
        </Suspense>
      </div>
    </div>
  )
}

function GridSkeleton () {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-1/4"/>
        <Skeleton className="h-10 w-32"/>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {skeletonKeys.map((key) => (
          <Skeleton key={key} className="h-48 w-full rounded-lg"/>
        ))}
      </div>
      <div className="p-4 flex justify-between items-center">
        <Skeleton className="h-8 w-1/5"/>
        <Skeleton className="h-10 w-1/4"/>
      </div>
    </div>
  )
}

// END OF: app/(main)/artifacts/page.tsx
