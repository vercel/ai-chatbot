/**
 * @file components/notes-data-table-display.tsx
 * @description Компонент для отображения таблицы заметок с использованием shadcn/ui.
 * @version 1.1.4
 * @date 2025-06-06
 * @updated Удален избыточный и ошибочный блок `else if` в логике рендеринга пагинации, который вызывал ошибку TS2367.
 */

/** HISTORY:
 * v1.1.4 (2025-06-06): Удален ошибочный блок `else if` в логике пагинации.
 * v1.1.3 (2025-06-06): Исправлена логическая ошибка в пагинации.
 * v1.1.2 (2025-06-06): Исправлены ошибки типизации (className, disabled) и логическая ошибка в пагинации.
 * v1.1.1 (2025-06-06): Исправлены ошибки типизации (className, disabled) и логическая ошибка в пагинации.
 * v1.1.0 (2025-06-06): Удален хук useArtifact, добавлен проп onRowClick для централизации логики.
 * v1.0.1 (2025-06-05): Уточнены типы NotesDocument и использование полей при открытии артефакта.
 * v1.0.0 (2025-06-05): Начальная версия компонента таблицы заметок.
 */

'use client';

import { useState, type MouseEvent } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontalIcon, TrashIcon, LoaderIcon, FileIcon } from '@/components/icons';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Document as DBDocument } from '@/lib/db/schema';
import { deleteTextNote } from '@/app/(main)/notes/actions';
import { toast } from '@/components/toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const skeletonKeys = ['s1', 's2', 's3', 's4', 's5']

export interface NotesDocument extends Pick<DBDocument, 'id' | 'title' | 'createdAt' | 'content' | 'kind'> {}

interface NotesDataTableDisplayProps {
  documents: NotesDocument[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  onRowClick: (doc: NotesDocument) => void;
}

function DisabledPaginationLink({ href, onClick, isDisabled, children, className }: { href: string, onClick: (e: MouseEvent<HTMLAnchorElement>) => void, isDisabled: boolean, children: React.ReactNode, className?: string }) {
    return (
        <PaginationLink
            href={href}
            onClick={(e) => {
                if (isDisabled) {
                    e.preventDefault();
                    return;
                }
                onClick(e);
            }}
            className={cn(className, {
                'pointer-events-none text-muted-foreground': isDisabled,
            })}
            aria-disabled={isDisabled}
        >
            {children}
        </PaginationLink>
    );
}


export function NotesDataTableDisplay({
  documents,
  isLoading,
  page,
  totalCount,
  totalPages,
  onPageChange,
  onRefresh,
  onRowClick,
}: NotesDataTableDisplayProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<NotesDocument | null>(null);

  const handleDeleteClick = (doc: NotesDocument) => {
    setDocumentToDelete(doc);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;
    setIsDeleting(documentToDelete.id);
    const result = await deleteTextNote(documentToDelete.id);
    if (result.success) {
      toast({ type: 'success', description: `Заметка "${documentToDelete.title}" удалена.` });
      onRefresh();
    } else {
      toast({ type: 'error', description: result.error || 'Не удалось удалить заметку.' });
    }
    setIsDeleting(null);
    setShowDeleteConfirm(false);
    setDocumentToDelete(null);
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxPagesToShow = 5;
    const ellipsis = <PaginationEllipsis key="ellipsis" />;

    if (totalPages <= maxPagesToShow + 2) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink href="#" isActive={page === i} onClick={(e) => { e.preventDefault(); onPageChange(i); }}>
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink href="#" isActive={page === 1} onClick={(e) => { e.preventDefault(); onPageChange(1); }}>
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (page > 3) {
        items.push(ellipsis);
      }

      let startPage = Math.max(2, page - 1);
      let endPage = Math.min(totalPages - 1, page + 1);

      if (page === 1) {
        startPage = 2;
        endPage = Math.min(totalPages -1, 3)
      }
      if (page === totalPages) {
        startPage = Math.max(2, totalPages - 2);
        endPage = totalPages-1;
      }

      for (let i = startPage; i <= endPage; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink href="#" isActive={page === i} onClick={(e) => { e.preventDefault(); onPageChange(i); }}>
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (page < totalPages - 2) {
        items.push(ellipsis);
      } else if (page === totalPages - 2) {
         items.push(
          <PaginationItem key={totalPages -1}>
            <PaginationLink href="#" isActive={page === totalPages - 1} onClick={(e) => { e.preventDefault(); onPageChange(totalPages - 1); }}>
              {totalPages - 1 }
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (totalPages > 1) {
        items.push(
          <PaginationItem key={totalPages}>
            <PaginationLink href="#" isActive={page === totalPages} onClick={(e) => { e.preventDefault(); onPageChange(totalPages); }}>
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }
    return items;
  };


  return (
    <>
      <div className="border rounded-md bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px] hidden sm:table-cell" />
              <TableHead>Название</TableHead>
              <TableHead className="hidden md:table-cell w-[200px]">Дата создания</TableHead>
              <TableHead className="w-[80px] text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
              {isLoading && documents.length === 0 ? (
                skeletonKeys.map((key) => (
                  <TableRow key={`skeleton-${key}`}>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-6 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-2/3" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : documents.length > 0 ? (
              documents.map((doc) => (
                <TableRow key={doc.id} className="group hover:bg-muted/50 cursor-pointer" onClick={() => onRowClick(doc)}>
                  <TableCell className="hidden sm:table-cell">
                    <FileIcon size={18} className="text-muted-foreground" />
                  </TableCell>
                  <TableCell className="font-medium py-3">{doc.title}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground py-3">
                    {format(new Date(doc.createdAt), 'd MMMM yyyy, HH:mm', { locale: ru })}
                  </TableCell>
                  <TableCell className="text-right py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 opacity-50 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                          <span className="sr-only">Открыть меню</span>
                          {isDeleting === doc.id ? <LoaderIcon className="h-4 w-4 animate-spin" /> : <MoreHorizontalIcon className="h-4 w-4" />}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {e.stopPropagation(); onRowClick(doc);}}>
                          Открыть
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {e.stopPropagation(); handleDeleteClick(doc);}}
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          disabled={isDeleting === doc.id}
                        >
                          <TrashIcon className="mr-2 h-4 w-4" />
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  Нет заметок для отображения.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
                <DisabledPaginationLink
                  href="#"
                  onClick={(e) => {e.preventDefault(); onPageChange(page - 1);}}
                  isDisabled={page === 1 || isLoading}
                >
                    <PaginationPrevious />
                </DisabledPaginationLink>
            </PaginationItem>
            {renderPaginationItems()}
            <PaginationItem>
               <DisabledPaginationLink
                  href="#"
                  onClick={(e) => {e.preventDefault(); onPageChange(page + 1);}}
                  isDisabled={page === totalPages || isLoading}
                >
                    <PaginationNext />
                </DisabledPaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Заметка &quot;{documentToDelete?.title}&quot; будет удалена навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDocumentToDelete(null)}>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// END OF: components/notes-data-table-display.tsx
