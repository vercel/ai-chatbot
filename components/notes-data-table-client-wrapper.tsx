/**
 * @file components/notes-data-table-client-wrapper.tsx
 * @description Клиентский компонент-обертка для таблицы заметок, управляющий состоянием и загрузкой данных.
 * @version 1.3.1
 * @date 2025-06-06
 * @updated Исправлена ошибка TS2322 (несуществующий пропс `className` у иконок).
 */

/** HISTORY:
 * v1.3.1 (2025-06-06): Исправлена передача `className` иконкам.
 * v1.3.0 (2025-06-06): Реализован обработчик onRowClick для открытия артефакта.
 * v1.2.0 (2025-06-06): Добавлена логика открытия артефакта при наличии openDocId в URL.
 * v1.1.0 (2025-06-05): Исправлен путь импорта 'createTextNote' с app/(notes) на app/(main).
 * v1.0.1 (2025-06-05): Уточнены типы NotesApiResponse (включение kind и content в NotesDocument).
 * v1.0.0 (2025-06-05): Начальная версия компонента.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusIcon, LoaderIcon } from '@/components/icons';
import { NotesDataTableDisplay, type NotesDocument } from './notes-data-table-display';
import { useDebounceCallback } from 'usehooks-ts';
import { createTextNote } from '@/app/(main)/notes/actions';
import { toast } from '@/components/toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useArtifact } from '@/hooks/use-artifact';
import type { ArtifactKind } from './artifact';

const PAGE_SIZE = 10;

interface NotesApiResponse {
  data: NotesDocument[];
  totalCount: number;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: 'An unknown error occurred' }));
    throw new Error(errorData.message || 'Failed to fetch data');
  }
  return res.json();
};

export function NotesDataTableClientWrapper({ userId, openDocId }: { userId: string; openDocId?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { setArtifact } = useArtifact();

  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const debouncedSearchTerm = useDebounceCallback(setSearchTerm, 500);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [isCreatingNote, setIsCreatingNote] = useState(false);

  const createQueryString = useCallback(
    (paramsToUpdate: Record<string, string | number | undefined>) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      for (const [name, value] of Object.entries(paramsToUpdate)) {
        if (value === undefined || value === '') {
          current.delete(name);
        } else {
          current.set(name, String(value));
        }
      }
      return current.toString();
    },
    [searchParams],
  );

  useEffect(() => {
    const newQuery = createQueryString({
      page: currentPage === 1 ? undefined : currentPage,
      search: searchTerm === '' ? undefined : searchTerm,
    });
    const finalQuery = newQuery.toString() ? `?${newQuery}` : '';
    router.push(`${pathname}${finalQuery}`, { scroll: false });
  }, [currentPage, searchTerm, router, pathname, createQueryString]);


  const { data, error, isLoading, mutate } = useSWR<NotesApiResponse>(
    `/api/notes?page=${currentPage}&pageSize=${PAGE_SIZE}&searchQuery=${encodeURIComponent(searchTerm)}`,
    fetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    },
  );

  const handleRowClick = (doc: NotesDocument) => {
    if (doc.kind) {
      setArtifact({
        documentId: doc.id,
        title: doc.title,
        kind: doc.kind as ArtifactKind,
        content: doc.content || '',
        isVisible: true,
        status: 'idle',
        displayMode: 'split',
        boundingBox: { top:0, left:0, width:0, height:0 },
      });
    } else {
      toast({ type: 'error', description: 'Не удалось определить тип документа.' });
    }
  };

  useEffect(() => {
    if (openDocId && data?.data) {
      const docToOpen = data.data.find(doc => doc.id === openDocId);
      if (docToOpen) {
        handleRowClick(docToOpen);
        const newQuery = createQueryString({ openDocId: undefined });
        router.replace(`${pathname}?${newQuery}`, { scroll: false });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openDocId, data]);


  const totalPages = data ? Math.ceil(data.totalCount / PAGE_SIZE) : 0;

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && (totalPages === 0 || newPage <= totalPages) ) {
      setCurrentPage(newPage);
    }
  };

  const handleCreateNote = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsCreatingNote(true);

    const formData = new FormData();
    formData.append('title', newNoteTitle);

    const result = await createTextNote(formData);

    if (result.success && result.documentId && result.title) {
      toast({ type: 'success', description: `Заметка "${result.title}" создана.` });
      setIsCreateDialogOpen(false);
      setNewNoteTitle('');
      mutate();
    } else {
      toast({ type: 'error', description: result.error || 'Не удалось создать заметку.' });
    }
    setIsCreatingNote(false);
  };


  if (error) {
    return <div className="text-destructive">Ошибка загрузки заметок: {error.message}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <Input
          placeholder="Поиск по заголовкам..."
          defaultValue={searchTerm}
          onChange={(e) => debouncedSearchTerm(e.target.value)}
          className="max-w-sm bg-background"
        />
        <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full sm:w-auto">
          <PlusIcon className="mr-2 h-4 w-4" /> Создать заметку
        </Button>
      </div>

      {isLoading && !data ? (
        <DataTableSkeletonPreview />
      ) : (
        <NotesDataTableDisplay
          documents={data?.data || []}
          isLoading={isLoading}
          page={currentPage}
          pageSize={PAGE_SIZE}
          totalCount={data?.totalCount || 0}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onRefresh={mutate}
          onRowClick={handleRowClick}
        />
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleCreateNote}>
            <DialogHeader>
              <DialogTitle>Создать новую заметку</DialogTitle>
              <DialogDescription>
                Введите название для вашей новой текстовой заметки. Вы сможете добавить содержимое позже.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="note-title" className="text-right">
                  Название
                </Label>
                <Input
                  id="note-title"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  className="col-span-3"
                  placeholder="Например, 'Идеи для проекта X'"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isCreatingNote}>
                  Отмена
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isCreatingNote}>
                {isCreatingNote ? <LoaderIcon className="mr-2 h-4 w-4 animate-spin" /> : null}
                Создать
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DataTableSkeletonPreview() {
  return (
    <div className="border rounded-md">
      <div className="p-4">
        <Skeleton className="h-8 w-full mb-4" />
        {[...Array(PAGE_SIZE / 2)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full mb-2" />
        ))}
      </div>
      <div className="p-4 border-t flex justify-between items-center">
        <Skeleton className="h-8 w-1/5" />
        <Skeleton className="h-10 w-1/4" />
      </div>
    </div>
  );
}

// END OF: components/notes-data-table-client-wrapper.tsx
