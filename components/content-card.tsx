/**
 * @file components/content-card.tsx
 * @description Компонент карточки для одного элемента контента.
 * @version 1.1.0
 * @date 2025-06-06
 * @updated Исправлена логика "Обсудить в чате" для корректной работы без перезагрузки страницы.
 */

/** HISTORY:
 * v1.1.0 (2025-06-06): Исправлена логика навигации в `handleDiscuss`.
 * v1.0.5 (2025-06-06): Исправлены стили и добавлена доступность (a11y).
 * v1.0.4 (2025-06-06): Добавлено обязательное поле `content` в создаваемый объект UIMessage.
 * v1.0.3 (2025-06-06): Добавлено обязательное поле `args: {}` в объект toolInvocation.
 * v1.0.2 (2025-06-06): Исправлен импорт типа UIMessage на Message as UIMessage.
 * v1.0.1 (2025-06-06): Исправлены ошибки TypeScript, связанные с импортом типов и структурой объекта.
 * v1.0.0 (2025-06-06): Начальная версия компонента.
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
import { generateUUID } from '@/lib/utils'
import type { Message as UIMessage, UseChatHelpers } from 'ai/react'
import { usePathname, useRouter } from 'next/navigation'

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

export function ContentCard ({ document, onRefresh, onCardClick, setMessages }: ContentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
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
    e.stopPropagation() // Предотвращаем клик по всей карточке

    const textContent = 'Давайте обсудим следующий документ:'
    const newUserMessage: UIMessage = {
      id: generateUUID(),
      role: 'user',
      createdAt: new Date(),
      content: textContent, // Добавлено обязательное поле
      parts: [
        { type: 'text', text: textContent },
        {
          type: 'tool-invocation',
          toolInvocation: {
            toolName: 'createDocument',
            toolCallId: generateUUID(),
            state: 'result',
            args: {},
            result: {
              id: document.id,
              title: document.title,
              kind: document.kind,
              content: `Документ "${document.title}" добавлен в чат для обсуждения.`,
            },
          }
        },
      ],
    }

    setMessages((currentMessages: UIMessage[]) => [...currentMessages, newUserMessage])

    // Если мы не на странице чата, переходим на главную
    if (!pathname.startsWith('/chat') && pathname !== '/') {
      router.push('/')
    }

    toast({ type: 'success', description: `"${document.title}" добавлен в чат.` })
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
        <div>
          <h3 className="text-base font-semibold leading-tight mb-1 truncate">{document.title}</h3>
          <p className="text-xs text-muted-foreground">
            {`Обновлено ${formatDistanceToNow(new Date(document.createdAt), { addSuffix: true, locale: ru })}`}
          </p>
        </div>
      </div>
    </div>
  )
}

// END OF: components/content-card.tsx
