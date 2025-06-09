/**
 * @file components/content-card.tsx
 * @description Компонент карточки для одного элемента контента.
 * @version 1.3.0
 * @date 2025-06-07
 * @updated Добавлено отображение поля `summary` на карточке.
 */

/** HISTORY:
 * v1.3.0 (2025-06-07): Добавлено отображение `summary`.
 * v1.2.0 (2025-06-06): `handleDiscuss` теперь использует API-маршрут `/api/chat/discuss-artifact`.
 * v1.1.0 (2025-06-06): Исправлена логика навигации в `handleDiscuss`.
 */
'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  BoxIcon,
  CodeIcon,
  FileIcon,
  ImageIcon,
  MessageCircleReplyIcon,
  MoreHorizontalIcon,
  TrashIcon
} from '@/components/icons'
import { deleteContent } from '@/app/(main)/content/actions'
import { toast } from '@/components/toast'
import type { ContentDocument } from './content-grid-display'
import type { UseChatHelpers } from 'ai/react'
import { useRouter } from 'next/navigation'
import { Skeleton } from './ui/skeleton'

interface ContentCardProps {
  document: ContentDocument;
  onRefresh: () => void;
  onCardClick: (doc: ContentDocument) => void;
  setMessages: UseChatHelpers['setMessages'];
}

const kindIcons = {
  text: FileIcon,
  code: CodeIcon,
  image: ImageIcon,
  sheet: BoxIcon,
}

export function ContentCard ({ document, onRefresh, onCardClick }: ContentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const Icon = kindIcons[document.kind] || FileIcon

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteContent(document.id)
    if (result.success) {
      toast({ type: 'success', description: `"${document.title}" удален.` })
      onRefresh()
    } else {
      toast({ type: 'error', description: result.error || 'Не удалось удалить контент.' })
    }
    setIsDeleting(false)
  }

  const handleDiscuss = (e: React.MouseEvent) => {
    e.stopPropagation()
    toast({ type: 'loading', description: 'Создание чата для обсуждения...' })
    router.push(`/api/chat/discuss-artifact?artifactId=${document.id}`)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className="group relative flex flex-col rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onCardClick(document)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onCardClick(document)
        }
      }}
    >
      <div className="p-4 grow flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <Icon className="size-6 text-muted-foreground mb-2"/>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="size-8 p-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}>
                <span className="sr-only">Открыть меню</span>
                <MoreHorizontalIcon className="size-4"/>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDiscuss}>
                <MessageCircleReplyIcon className="mr-2 size-4"/>
                Обсудить в чате
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete()
                }}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                disabled={isDeleting}
              >
                <TrashIcon className="mr-2 size-4"/>
                {isDeleting ? 'Удаление...' : 'Удалить'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-base font-semibold leading-tight mb-1 truncate">{document.title}</h3>

          {document.summary ? (
            <p className="text-xs text-muted-foreground line-clamp-2">{document.summary}</p>
          ) : (
            <div className="space-y-1">
              <Skeleton className="h-3 w-4/5"/>
              <Skeleton className="h-3 w-3/5"/>
            </div>
          )}

          <p className="text-xs text-muted-foreground pt-1">
            {`Обновлено ${formatDistanceToNow(new Date(document.createdAt), { addSuffix: true, locale: ru })}`}
          </p>
        </div>
      </div>
    </div>
  )
}

// END OF: components/content-card.tsx
