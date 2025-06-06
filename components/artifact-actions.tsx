/**
 * @file components/artifact-actions.tsx
 * @description Компонент с действиями для артефакта.
 * @version 2.1.0
 * @date 2025-06-06
 * @updated Исправлена логика "Обсудить в чате", чтобы не перезагружать страницу, если чат уже открыт, и добавлено закрытие панели артефакта.
 */

/** HISTORY:
 * v2.1.0 (2025-06-06): Исправлена логика "Обсудить в чате".
 * v2.0.4 (2025-06-06): Добавлено обязательное поле `content` в создаваемый объект UIMessage.
 * v2.0.3 (2025-06-06): Добавлено обязательное поле `args: {}` в объект toolInvocation.
 * v2.0.2 (2025-06-06): Исправлен импорт типа UIMessage на Message as UIMessage.
 * v2.0.1 (2025-06-06): Исправлена ошибка типа для `tool-invocation` и импорт `toast`.
 * v2.0.0 (2025-06-06): Реализована клиентская логика "Обсудить в чате" и индикатор сохранения.
 */

import { Button } from './ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'
import { artifactDefinitions, type UIArtifact } from './artifact'
import { type Dispatch, memo, type SetStateAction, useState } from 'react'
import type { ArtifactActionContext } from './create-artifact'
import { cn, generateUUID } from '@/lib/utils'
import { toast } from '@/components/toast'
import { CheckCircleFillIcon, LoaderIcon, MessageCircleReplyIcon, VercelIcon } from './icons'
import { usePathname, useRouter } from 'next/navigation'
import { type Message as UIMessage, useChat } from 'ai/react'
import { useArtifact } from '@/hooks/use-artifact'

interface ArtifactActionsProps {
  artifact: UIArtifact;
  handleVersionChange: (type: 'next' | 'prev' | 'toggle' | 'latest') => void;
  currentVersionIndex: number;
  isCurrentVersion: boolean;
  mode: 'edit' | 'diff';
  metadata: any;
  setMetadata: Dispatch<SetStateAction<any>>;
}

function SaveStatusIndicator ({ status }: { status: UIArtifact['saveStatus'] }) {
  if (status === 'idle') {
    return <VercelIcon size={18}/>
  }
  if (status === 'saving') {
    return <LoaderIcon className="animate-spin" size={18}/>
  }
  if (status === 'saved') {
    return <CheckCircleFillIcon size={18} className="text-green-500"/>
  }
  return null
}

function PureArtifactActions ({
  artifact,
  handleVersionChange,
  currentVersionIndex,
  isCurrentVersion,
  mode,
  metadata,
  setMetadata,
}: ArtifactActionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { setMessages } = useChat()
  const { setArtifact } = useArtifact()

  const artifactDefinition = artifactDefinitions.find(
    (definition) => definition.kind === artifact.kind,
  )

  if (!artifactDefinition) {
    throw new Error('Artifact definition not found!')
  }

  const handleDiscuss = () => {
    const textContent = 'Давайте обсудим следующий документ:'
    const newUserMessage: UIMessage = {
      id: generateUUID(),
      role: 'user',
      createdAt: new Date(),
      content: textContent,
      parts: [
        {
          type: 'text',
          text: textContent,
        },
        {
          type: 'tool-invocation',
          toolInvocation: {
            toolName: 'createDocument',
            toolCallId: generateUUID(),
            state: 'result',
            args: {},
            result: {
              id: artifact.documentId,
              title: artifact.title,
              kind: artifact.kind,
              content: `Документ "${artifact.title}" добавлен в чат для обсуждения.`,
            },
          },
        },
      ],
    }

    setMessages(currentMessages => [...currentMessages, newUserMessage])
    setArtifact(prev => ({ ...prev, isVisible: false }))

    // Если мы не на странице чата, переходим на главную
    if (!pathname.startsWith('/chat') && pathname !== '/') {
      router.push('/')
    }

    toast({ type: 'success', description: `Артефакт "${artifact.title}" добавлен в чат.` })
  }

  const actionContext: ArtifactActionContext = {
    content: artifact.content,
    handleVersionChange,
    currentVersionIndex,
    isCurrentVersion,
    mode,
    metadata,
    setMetadata,
  }

  return (
    <div className="flex flex-row gap-1 items-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className="h-fit p-2 dark:hover:bg-zinc-700"
            onClick={handleDiscuss}
            disabled={isLoading || artifact.status === 'streaming'}
          >
            <MessageCircleReplyIcon size={18}/>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Обсудить в чате</TooltipContent>
      </Tooltip>

      {artifactDefinition.actions.map((action) => (
        <Tooltip key={action.description}>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className={cn('h-fit dark:hover:bg-zinc-700', {
                'p-2': !action.label,
                'py-1.5 px-2': action.label,
              })}
              onClick={async () => {
                setIsLoading(true)
                try {
                  await Promise.resolve(action.onClick(actionContext))
                } catch (error) {
                  toast({ type: 'error', description: 'Failed to execute action' })
                } finally {
                  setIsLoading(false)
                }
              }}
              disabled={
                isLoading || artifact.status === 'streaming'
                  ? true
                  : action.isDisabled
                    ? action.isDisabled(actionContext)
                    : false
              }
            >
              {action.icon}
              {action.label}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{action.description}</TooltipContent>
        </Tooltip>
      ))}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="p-2">
            <SaveStatusIndicator status={artifact.saveStatus}/>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {artifact.saveStatus === 'saved' && 'Все изменения сохранены'}
          {artifact.saveStatus === 'saving' && 'Сохранение...'}
          {artifact.saveStatus === 'idle' && 'Есть несохраненные изменения'}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

export const ArtifactActions = memo(
  PureArtifactActions,
  (prevProps, nextProps) => {
    if (prevProps.artifact.status !== nextProps.artifact.status) return false
    if (prevProps.artifact.saveStatus !== nextProps.artifact.saveStatus) return false
    if (prevProps.currentVersionIndex !== nextProps.currentVersionIndex) return false
    if (prevProps.isCurrentVersion !== nextProps.isCurrentVersion) return false
    if (prevProps.artifact.content !== nextProps.artifact.content) return false
    return true
  },
)

// END OF: components/artifact-actions.tsx
