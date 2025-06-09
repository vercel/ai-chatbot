/**
 * @file components/artifact-grid-display.tsx
 * @description Компонент для отображения артефактов в виде сетки карточек.
 * @version 2.0.0
 * @date 2025-06-09
 * @updated Переименован из ContentGridDisplay и адаптирован под новую архитектуру.
 */

'use client'

import type { MouseEvent } from 'react'
import { Pagination, PaginationContent, PaginationLink, } from '@/components/ui/pagination'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { Artifact as DBArtifact } from '@/lib/db/schema'
import { ArtifactCard } from './artifact-card'

const skeletonKeys = Array.from({ length: 4 }, (_, i) => `sk-${i}`)

export interface ArtifactDocument extends Pick<DBArtifact, 'id' | 'title' | 'createdAt' | 'content' | 'kind' | 'summary'> {}

interface ArtifactGridDisplayProps {
  artifacts: ArtifactDocument[];
  isLoading: boolean;
  page: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  onCardClick: (doc: ArtifactDocument) => void;
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

export function ArtifactGridDisplay ({
  artifacts,
  isLoading,
  page,
  totalPages,
  onPageChange,
  onRefresh,
  onCardClick,
}: ArtifactGridDisplayProps) {

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {artifacts.map((doc) => (
          <ArtifactCard key={doc.id} artifact={doc} onRefresh={onRefresh} onCardClick={onCardClick}/>
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
      {artifacts.length === 0 && !isLoading && (
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

// END OF: components/artifact-grid-display.tsx
