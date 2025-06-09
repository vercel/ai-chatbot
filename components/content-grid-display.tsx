/**
 * @file components/content-grid-display.tsx
 * @description Компонент для отображения контента в виде сетки карточек.
 * @version 1.1.0
 * @date 2025-06-07
 * @updated Добавлено поле `summary` в интерфейс `ContentDocument`.
 */

/** HISTORY:
 * v1.1.0 (2025-06-07): Интерфейс `ContentDocument` теперь включает `summary`.
 * v1.0.1 (2025-06-06): Исправлена проблема с key в цикле.
 * v1.0.0 (2025-06-06): Начальная версия компонента.
 */
'use client'

import type { MouseEvent } from 'react'
import { Pagination, PaginationContent, PaginationLink, } from '@/components/ui/pagination'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { Document as DBDocument } from '@/lib/db/schema'
import { ContentCard } from './content-card'
import type { UseChatHelpers } from '@ai-sdk/react'

const skeletonKeys = Array.from({ length: 4 }, (_, i) => `sk-${i}`)

export interface ContentDocument extends Pick<DBDocument, 'id' | 'title' | 'createdAt' | 'content' | 'kind' | 'summary'> {}

interface ContentGridDisplayProps {
  documents: ContentDocument[];
  isLoading: boolean;
  page: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  onCardClick: (doc: ContentDocument) => void;
  setMessages: UseChatHelpers['setMessages'];
}

function DisabledPaginationLink ({ href, onClick, isDisabled, children, className }: {
  href: string,
  onClick: (e: MouseEvent<HTMLAnchorElement>) => void,
  isDisabled: boolean,
  children: React.ReactNode,
  className?: string
}) {
  return (
    <PaginationLink
      href={href}
      onClick={(e) => {
        if (isDisabled) {
          e.preventDefault()
          return
        }
        onClick(e)
      }}
      className={cn(className, {
        'pointer-events-none text-muted-foreground': isDisabled,
      })}
      aria-disabled={isDisabled}
    >
      {children}
    </PaginationLink>
  )
}

export function ContentGridDisplay ({
  documents,
  isLoading,
  page,
  totalPages,
  onPageChange,
  onRefresh,
  onCardClick,
  setMessages,
}: ContentGridDisplayProps) {

  // ... (логика пагинации, если нужна, может быть вынесена в отдельный хук)
  // Для простоты оставим текущую реализацию из таблицы

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {documents.map((doc) => (
          <ContentCard key={doc.id} document={doc} onRefresh={onRefresh} onCardClick={onCardClick}
                       setMessages={setMessages}/>
        ))}
        {isLoading && skeletonKeys.map((key) => (
          <div key={key} className="flex flex-col space-y-3">
            <Skeleton className="h-[125px] w-full rounded-xl"/>
            <div className="space-y-2">
              <Skeleton className="h-4 w-4/5"/>
              <Skeleton className="h-4 w-2/5"/>
            </div>
          </div>
        ))}
      </div>
      {documents.length === 0 && !isLoading && (
        <div className="col-span-full h-48 flex items-center justify-center text-muted-foreground">
          Ничего не найдено. Попробуйте другой поисковый запрос.
        </div>
      )}

      {totalPages > 1 && (
        <Pagination className="mt-8">
          <PaginationContent>
            {/* ... элементы пагинации ... */}
          </PaginationContent>
        </Pagination>
      )}
    </>
  )
}

// END OF: components/content-grid-display.tsx
