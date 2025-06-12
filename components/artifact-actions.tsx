'use client'; // <-- ДОБАВЛЕНО

/**
 * @file components/artifact-actions.tsx
 * @description Компонент с действиями для артефакта.
 * @version 2.3.0
 * @date 2025-06-11
 * @updated Added 'use client' directive to resolve React hook errors.
 */

/** HISTORY:
 * v2.3.0 (2025-06-11): Added 'use client' directive.
 * v2.2.1 (2025-06-10): Corrected property access to 'artifactId' on UIArtifact type (TS2339).
 * v2.2.0 (2025-06-06): `handleDiscuss` теперь использует API-маршрут `/api/chat/discuss-artifact`.
 */

import { Button } from './ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'
import { artifactDefinitions, type UIArtifact } from './artifact'
import { type Dispatch, memo, type SetStateAction, useState } from 'react'
import type { ArtifactActionContext } from './create-artifact'
import { cn } from '@/lib/utils'
import { toast } from '@/components/toast'
import { CheckCircleFillIcon, LoaderIcon, MessageCircleReplyIcon, MessageCircleIcon, VercelIcon } from './icons'
import { useRouter } from 'next/navigation'
import { useArtifact } from '@/hooks/use-artifact'
import { copyArtifactToClipboard } from '@/app/app/(main)/artifacts/actions'

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
  const { setArtifact } = useArtifact()

  const artifactDefinition = artifactDefinitions.find(
    (definition) => definition.kind === artifact.kind,
  )

  if (!artifactDefinition) {
    throw new Error('Artifact definition not found!')
  }

  const handleDiscuss = () => {
    toast({ type: 'loading', description: 'Создание чата для обсуждения...' })
    setArtifact(prev => ({ ...prev, isVisible: false }))
    router.push(`/api/chat/discuss-artifact?artifactId=${artifact.artifactId}`)
  }

  const handleAddToChat = async () => {
    if (!artifact.artifactId) return
    setIsLoading(true)
    try {
      await copyArtifactToClipboard({
        artifactId: artifact.artifactId,
        title: artifact.title,
        kind: artifact.kind,
      })
      toast({ type: 'success', description: 'Ссылка на артефакт скопирована' })
    } catch (error) {
      toast({ type: 'error', description: 'Не удалось добавить в чат' })
    } finally {
      setIsLoading(false)
    }
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

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className="h-fit p-2 dark:hover:bg-zinc-700"
            onClick={handleAddToChat}
            disabled={isLoading || artifact.status === 'streaming'}
          >
            <MessageCircleIcon size={18}/>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Добавить в чат</TooltipContent>
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
