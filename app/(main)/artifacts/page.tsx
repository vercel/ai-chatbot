'use client' // <-- УЖЕ БЫЛО, НО ЛОГИКА ИЗМЕНЕНА

/**
 * @file app/(main)/artifacts/page.tsx
 * @description Страница для отображения и управления всеми артефактами пользователя.
 * @version 2.1.0
 * @date 2025-06-11
 * @updated Refactored to use `useSearchParams` hook to avoid runtime errors in client components.
 */

/** HISTORY:
 * v2.1.0 (2025-06-11): Refactored to use `useSearchParams` hook.
 * v2.0.0 (2025-06-09): Переименовано в "Артефакты".
 */

import { Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { redirect, useSearchParams } from 'next/navigation' // <-- ИЗМЕНЕН ИМПОРТ
import { ArtifactGridClientWrapper } from '@/components/artifact-grid-client-wrapper'
import { Skeleton } from '@/components/ui/skeleton'

const skeletonKeys = Array.from({ length: 8 }, (_, i) => `sk-${i}`)

// Оборачиваем основной компонент в Suspense Boundary, чтобы useSearchParams не вызывал ошибок
function ArtifactsPageContent () {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams() // <-- ИСПОЛЬЗУЕМ ХУК
  const openArtifactId = searchParams.get('openArtifactId') as string | undefined // <-- ПОЛУЧАЕМ ПАРАМЕТР

  if (status === 'loading') {
    return <GridSkeleton/>
  }

  if (status === 'unauthenticated' || !session?.user?.id) {
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

        {/* Suspense здесь уже не для `searchParams`, а для `ArtifactGridClientWrapper` */}
        <Suspense fallback={<GridSkeleton/>}>
          <ArtifactGridClientWrapper userId={session.user.id} openArtifactId={openArtifactId}/>
        </Suspense>
      </div>
    </div>
  )
}

export default function ArtifactsPage () {
  return (
    // Обертка в Suspense на верхнем уровне обязательна для useSearchParams
    <Suspense fallback={<GridSkeleton/>}>
      <ArtifactsPageContent/>
    </Suspense>
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
