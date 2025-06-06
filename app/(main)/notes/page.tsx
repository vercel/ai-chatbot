/**
 * @file app/(main)/notes/page.tsx
 * @description Страница для отображения и управления списком текстовых заметок.
 * @version 1.3.0
 * @date 2025-06-05
 * @updated Добавлена обработка query-параметра openDocId для открытия артефакта.
 */

/** HISTORY:
 * v1.3.0 (2025-06-05): Добавлена обработка openDocId.
 * v1.2.0 (2025-06-05): Удален компонент Artifact.
 * v1.1.0 (2025-06-05): Добавлен компонент Artifact для просмотра заметок.
 * v1.0.0 (2025-06-05): Начальная версия.
 */
'use client'

import { Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { NotesDataTableClientWrapper } from '@/components/notes-data-table-client-wrapper';
import { Skeleton } from '@/components/ui/skeleton';

export default function NotesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { data: session, status } = useSession();
  const openDocId = searchParams?.openDocId as string | undefined;

  if (status === 'loading') {
    return <DataTableSkeleton />;
  }

  if (!session?.user?.id) {
    redirect('/login');
  }

  return (
    <div className="flex h-full">
      <div className="container mx-auto py-10 px-4 md:px-6 lg:px-8 flex-1">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Мои Заметки
          </h1>
          <p className="text-muted-foreground">
            Здесь вы можете управлять всеми вашими текстовыми заметками.
          </p>
        </header>

        <Suspense fallback={<DataTableSkeleton />}>
          <NotesDataTableClientWrapper userId={session.user.id} openDocId={openDocId} />
        </Suspense>
      </div>
    </div>
  );
}

function DataTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-12 w-full" />
      <div className="border rounded-md">
        <div className="p-4">
          <Skeleton className="h-8 w-full mb-4" />
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full mb-2" />
          ))}
        </div>
        <div className="p-4 border-t flex justify-between items-center">
          <Skeleton className="h-8 w-1/5" />
          <Skeleton className="h-10 w-1/4" />
        </div>
      </div>
    </div>
  );
}

// END OF: app/(main)/notes/page.tsx