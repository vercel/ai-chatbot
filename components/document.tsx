/**
 * @file components/document.tsx
 * @description Компоненты для отображения результатов вызова тулзов, связанных с документами.
 * @version 1.3.0
 * @date 2025-06-10
 * @updated Импорт ArtifactKind теперь из общего файла lib/types.
 */

/** HISTORY:
 * v1.3.0 (2025-06-10): Импорт ArtifactKind из lib/types.
 * v1.2.1 (2025-06-10): Corrected object literal for setArtifact: changed 'documentId' to 'artifactId' to match UIArtifact type (TS2353).
 * v1.2.0 (2025-06-06): Восстановлена утерянная функция getActionText и исправлен импорт toast.
 */
import { memo } from 'react'

import { FileIcon, LoaderIcon, MessageIcon, PencilEditIcon } from './icons'
import { toast } from '@/components/toast'
import { useArtifact } from '@/hooks/use-artifact'
import type { ArtifactKind } from '@/lib/types' // <-- ИЗМЕНЕН ИМПОРТ

const getActionText = (
  type: 'create' | 'update' | 'request-suggestions',
  tense: 'present' | 'past',
) => {
  switch (type) {
    case 'create':
      return tense === 'present' ? 'Creating' : 'Created'
    case 'update':
      return tense === 'present' ? 'Updating' : 'Updated'
    case 'request-suggestions':
      return tense === 'present'
        ? 'Adding suggestions'
        : 'Added suggestions to'
    default:
      return null
  }
}

interface DocumentToolResultProps {
  type: 'create' | 'update' | 'request-suggestions';
  result: { id: string; title: string; kind: ArtifactKind };
  isReadonly: boolean;
}

function PureDocumentToolResult ({
  type,
  result,
  isReadonly,
}: DocumentToolResultProps) {
  const { setArtifact } = useArtifact()

  return (
    <button
      type="button"
      className="bg-background cursor-pointer border py-2 px-3 rounded-xl w-fit flex flex-row gap-3 items-start"
      onClick={(event) => {
        if (isReadonly) {
          toast({
            type: 'error',
            description: 'Просмотр файлов в общих чатах пока не поддерживается.',
          })
          return
        }

        const rect = event.currentTarget.getBoundingClientRect()

        const boundingBox = {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        }

        setArtifact({
          artifactId: result.id,
          kind: result.kind,
          content: '',
          title: result.title,
          isVisible: true,
          status: 'idle',
          saveStatus: 'saved',
          displayMode: 'split',
          boundingBox,
        })
      }}
    >
      <div className="text-muted-foreground mt-1">
        {type === 'create' ? (
          <FileIcon/>
        ) : type === 'update' ? (
          <PencilEditIcon/>
        ) : type === 'request-suggestions' ? (
          <MessageIcon/>
        ) : null}
      </div>
      <div className="text-left">
        {`${getActionText(type, 'past')} "${result.title}"`}
      </div>
    </button>
  )
}

export const DocumentToolResult = memo(PureDocumentToolResult, () => true)

interface DocumentToolCallProps {
  type: 'create' | 'update' | 'request-suggestions';
  args: { title: string };
  isReadonly: boolean;
}

function PureDocumentToolCall ({
  type,
  args,
  isReadonly,
}: DocumentToolCallProps) {
  const { setArtifact } = useArtifact()

  return (
    <button
      type="button"
      className="cursor pointer w-fit border py-2 px-3 rounded-xl flex flex-row items-start justify-between gap-3"
      onClick={(event) => {
        if (isReadonly) {
          toast({
            type: 'error',
            description: 'Просмотр файлов в общих чатах пока не поддерживается.',
          })
          return
        }

        const rect = event.currentTarget.getBoundingClientRect()

        const boundingBox = {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        }

        setArtifact((currentArtifact) => ({
          ...currentArtifact,
          isVisible: true,
          boundingBox,
        }))
      }}
    >
      <div className="flex flex-row gap-3 items-start">
        <div className="text-zinc-500 mt-1">
          {type === 'create' ? (
            <FileIcon/>
          ) : type === 'update' ? (
            <PencilEditIcon/>
          ) : type === 'request-suggestions' ? (
            <MessageIcon/>
          ) : null}
        </div>

        <div className="text-left">
          {`${getActionText(type, 'present')} ${args.title ? `"${args.title}"` : ''}`}
        </div>
      </div>

      <div className="animate-spin mt-1">{<LoaderIcon/>}</div>
    </button>
  )
}

export const DocumentToolCall = memo(PureDocumentToolCall, () => true)

// END OF: components/document.tsx
