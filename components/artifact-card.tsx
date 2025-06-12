/**
 * @file components/artifact-card.tsx
 * @description Компонент карточки для одного артефакта.
 * @version 2.0.0
 * @date 2025-06-09
 * @updated Переименован, добавлены новые действия, адаптирован под новую архитектуру.
 */

/** HISTORY:
 * v2.0.0 (2025-06-09): Рефакторинг в ArtifactCard, добавлены новые действия.
 * v1.3.0 (2025-06-07): Добавлено отображение поля `summary`.
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
  PencilEditIcon,
  TrashIcon
} from '@/components/icons'
import { deleteArtifact } from '@/app/app/(main)/artifacts/actions'
import { toast } from '@/components/toast'
import type { Artifact as DBArtifact } from '@/lib/db/schema'
import { useRouter } from 'next/navigation'
import { Skeleton } from './ui/skeleton'

export interface ArtifactDocument extends Pick<DBArtifact, 'id' | 'title' | 'createdAt' | 'content' | 'kind' | 'summary'> {}

interface ArtifactCardProps {
  artifact: ArtifactDocument;
  onRefresh: () => void;
  onCardClick: (doc: ArtifactDocument) => void;
}

const kindIcons = {
  text: FileIcon,
  code: CodeIcon,
  image: ImageIcon,
  sheet: BoxIcon,
  site: FileIcon,
}

export function ArtifactCard ({ artifact, onRefresh, onCardClick }: ArtifactCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const Icon = kindIcons[artifact.kind] || FileIcon

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteArtifact(artifact.id)
    if (result.success) {
      toast({ type: 'success', description: `Артефакт "${artifact.title}" перемещен в корзину.` })
      onRefresh()
    } else {
      toast({ type: 'error', description: result.error || 'Не удалось удалить артефакт.' })
    }
    setIsDeleting(false)
  }

  const handleDiscuss = (e: React.MouseEvent) => {
    e.stopPropagation()
    toast({ type: 'loading', description: 'Создание чата для обсуждения...' })
    router.push(`/api/chat/discuss-artifact?artifactId=${artifact.id}`)
  }

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation()
    toast({ type: 'success', description: 'Функция переименования будет добавлена в будущем.' })
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className="group relative flex flex-col rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onCardClick(artifact)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onCardClick(artifact) }}
    >
      <div className="p-4 grow flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <Icon className="size-6 text-muted-foreground mb-2"/>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="size-8 p-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}>
                <MoreHorizontalIcon className="size-4"/>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={handleRename}>
                <PencilEditIcon className="mr-2 size-4"/>
                Переименовать
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDiscuss}>
                <MessageCircleReplyIcon className="mr-2 size-4"/>
                Обсудить в чате
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                disabled={isDeleting}
              >
                <TrashIcon className="mr-2 size-4"/>
                {isDeleting ? 'Удаление...' : 'В корзину'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-base font-semibold leading-tight mb-1 truncate">{artifact.title}</h3>

          {artifact.summary ? (
            <p className="text-xs text-muted-foreground line-clamp-2">{artifact.summary}</p>
          ) : (
            <div className="space-y-1">
              <Skeleton className="h-3 w-4/5"/>
              <Skeleton className="h-3 w-3/5"/>
            </div>
          )}

          <p className="text-xs text-muted-foreground pt-1">
            {`Обновлено ${formatDistanceToNow(new Date(artifact.createdAt), { addSuffix: true, locale: ru })}`}
          </p>
        </div>
      </div>
    </div>
  )
}

// END OF: components/artifact-card.tsx
