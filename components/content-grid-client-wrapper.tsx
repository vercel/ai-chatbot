/**
 * @file components/content-grid-client-wrapper.tsx
 * @description Клиентский компонент-обертка для сетки контента, управляющий состоянием и загрузкой данных.
 * @version 1.0.1
 * @date 2025-06-06
 * @updated Исправлены стили Tailwind и проблема с key в цикле.
 */

/** HISTORY:
 * v1.0.1 (2025-06-06): Исправлены стили Tailwind и проблема с key в цикле.
 * v1.0.0 (2025-06-06): Начальная версия компонента.
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import useSWR from 'swr'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PlusIcon } from '@/components/icons'
import { type ContentDocument, ContentGridDisplay } from './content-grid-display'
import { useDebounceCallback } from 'usehooks-ts'
import { toast } from '@/components/toast'
import { Skeleton } from '@/components/ui/skeleton'
import { useArtifact } from '@/hooks/use-artifact'
import type { ArtifactKind } from './artifact'
import { fetcher } from '@/lib/utils'
import { useChat } from '@ai-sdk/react'

const PAGE_SIZE = 12
const skeletonKeys = Array.from({ length: PAGE_SIZE }, (_, i) => `sk-item-${i}`)

interface ContentApiResponse {
  data: ContentDocument[];
  totalCount: number;
}

export function ContentGridClientWrapper ({ userId, openDocId }: { userId: string; openDocId?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const { setArtifact } = useArtifact()
  const { setMessages } = useChat() // Для добавления артефакта в чат

  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const debouncedSearchTerm = useDebounceCallback(setSearchTerm, 500)

  const createQueryString = useCallback(
    (paramsToUpdate: Record<string, string | number | undefined>) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()))
      for (const [name, value] of Object.entries(paramsToUpdate)) {
        if (value === undefined || value === '') {
          current.delete(name)
        } else {
          current.set(name, String(value))
        }
      }
      return current.toString()
    },
    [searchParams],
  )

  useEffect(() => {
    const newQuery = createQueryString({
      page: currentPage === 1 ? undefined : currentPage,
      search: searchTerm === '' ? undefined : searchTerm,
    })
    const finalQuery = newQuery.toString() ? `?${newQuery}` : ''
    router.push(`${pathname}${finalQuery}`, { scroll: false })
  }, [currentPage, searchTerm, router, pathname, createQueryString])

  const { data, error, isLoading, mutate } = useSWR<ContentApiResponse>(
    `/api/content?page=${currentPage}&pageSize=${PAGE_SIZE}&searchQuery=${encodeURIComponent(searchTerm)}`,
    fetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    },
  )

  const handleCardClick = (doc: ContentDocument) => {
    if (doc.kind) {
      toast({ type: 'loading', description: `Открываю "${doc.title}"...` })
      setArtifact({
        documentId: doc.id,
        title: doc.title,
        kind: doc.kind as ArtifactKind,
        content: doc.content || '',
        isVisible: true,
        status: 'idle',
        saveStatus: 'saved',
        displayMode: 'split',
        boundingBox: { top: 0, left: 0, width: 0, height: 0 },
      })
    } else {
      toast({ type: 'error', description: 'Не удалось определить тип документа.' })
    }
  }

  useEffect(() => {
    if (openDocId && data?.data) {
      const docToOpen = data.data.find(doc => doc.id === openDocId)
      if (docToOpen) {
        handleCardClick(docToOpen)
        const newQuery = createQueryString({ openDocId: undefined })
        router.replace(`${pathname}?${newQuery}`, { scroll: false })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openDocId, data])

  const totalPages = data ? Math.ceil(data.totalCount / PAGE_SIZE) : 0

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && (totalPages === 0 || newPage <= totalPages)) {
      setCurrentPage(newPage)
    }
  }

  if (error) {
    return <div className="text-destructive">Ошибка загрузки контента: {error.message}</div>
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
        <Button onClick={() => router.push('/')} className="w-full sm:w-auto">
          <PlusIcon className="mr-2 size-4"/> Создать новый
        </Button>
      </div>

      {isLoading && !data ? (
        <GridSkeletonPreview/>
      ) : (
        <ContentGridDisplay
          documents={data?.data || []}
          isLoading={isLoading}
          page={currentPage}
          totalCount={data?.totalCount || 0}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onRefresh={mutate}
          onCardClick={handleCardClick}
          setMessages={setMessages}
        />
      )}
    </div>
  )
}

function GridSkeletonPreview () {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {skeletonKeys.map((key) => (
          <div key={key} className="flex flex-col space-y-3">
            <Skeleton className="h-[125px] w-full rounded-xl"/>
            <div className="space-y-2">
              <Skeleton className="h-4 w-4/5"/>
              <Skeleton className="h-4 w-2/5"/>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 flex justify-between items-center">
        <Skeleton className="h-8 w-1/5"/>
        <Skeleton className="h-10 w-1/4"/>
      </div>
    </div>
  )
}

// END OF: components/content-grid-client-wrapper.tsx
