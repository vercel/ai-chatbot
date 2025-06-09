/**
 * @file components/artifact-preview.tsx
 * @description Компонент для отображения превью артефактов в чате.
 * @version 2.0.0
 * @date 2025-06-09
 * @updated Переименован, адаптирован под новую архитектуру с ArtifactMetadata и фоновую загрузку данных.
 */

/** HISTORY:
 * v2.0.0 (2025-06-09): Переименован, адаптирован под ArtifactMetadata и SWR.
 * v1.2.0 (2025-06-07): Реализован диспетчер превью.
 */
import { memo, type MouseEvent, useCallback, useMemo, useRef, } from 'react'
import type { ArtifactKind } from './artifact'
import { BoxIcon, CodeIcon, FileIcon, FullscreenIcon, ImageIcon } from './icons'
import { cn, fetcher } from '@/lib/utils'
import type { Artifact as DBArtifact } from '@/lib/db/schema'
import { InlineDocumentSkeleton } from './document-skeleton'
import useSWR from 'swr'
import { useArtifact } from '@/hooks/use-artifact'
import { ImageEditor } from './image-editor'
import { toast } from './toast'
import type { artifactCreate } from '@/lib/ai/tools/artifactCreate'

type ArtifactMetadata = Awaited<ReturnType<ReturnType<typeof artifactCreate>['execute']>>;

interface ArtifactPreviewProps {
  isReadonly: boolean;
  result: ArtifactMetadata;
}

export function ArtifactPreview ({ isReadonly, result }: ArtifactPreviewProps) {
  const { setArtifact } = useArtifact()
  const artifactId = result.artifactId

  const { data: artifacts, isLoading } = useSWR<Array<DBArtifact>>(
    artifactId ? `/api/artifact?id=${artifactId}` : null,
    fetcher,
    {
      refreshInterval: (data) => (data && data.length > 0 && !data[data.length - 1].summary ? 3000 : 0),
    }
  )

  const fullArtifact = useMemo(() => artifacts?.[artifacts.length - 1], [artifacts])
  const hitboxRef = useRef<HTMLDivElement>(null)

  const handleOpenArtifact = useCallback((event: MouseEvent<HTMLElement>) => {
    const boundingBox = event.currentTarget.getBoundingClientRect()
    toast({ type: 'loading', description: `Открываю артефакт "${result.artifactTitle}"...` })
    setArtifact({
      artifactId: artifactId,
      kind: result.artifactKind,
      title: result.artifactTitle,
      content: fullArtifact?.content ?? '',
      status: 'idle',
      saveStatus: 'saved',
      isVisible: true,
      displayMode: 'split',
      boundingBox: {
        left: boundingBox.x,
        top: boundingBox.y,
        width: boundingBox.width,
        height: boundingBox.height,
      },
    })
  }, [setArtifact, result, artifactId, fullArtifact])

  return (
    <div className="relative w-full cursor-pointer" ref={hitboxRef} onClick={handleOpenArtifact} role="button"
         tabIndex={0}>
      <ArtifactHeader
        title={result.artifactTitle}
        kind={result.artifactKind}
        description={result.description}
      />
      <div
        className={cn('h-[257px] overflow-y-scroll border rounded-b-2xl dark:bg-muted border-t-0 dark:border-zinc-700', { 'p-6': result.artifactKind !== 'image' })}>
        {isLoading && !fullArtifact ? <InlineDocumentSkeleton/> :
          result.artifactKind === 'image' ? <ImageEditor title={result.artifactTitle}
                                                         content={fullArtifact?.content ?? ''} status="idle"
                                                         isInline={true}/> :
            <div className="prose dark:prose-invert prose-sm">
              <p
                className="text-muted-foreground italic">{fullArtifact?.summary || result.summary || 'Summary is being generated...'}</p>
            </div>
        }
      </div>
      <div className="absolute right-[9px] top-[13px] p-2 hover:dark:bg-zinc-700 rounded-md hover:bg-zinc-100 z-20">
        <FullscreenIcon/>
      </div>
    </div>
  )
}

const ArtifactHeader = memo(({ title, kind, description }: {
  title: string;
  kind: ArtifactKind;
  description: string
}) => {
  const Icon = kind === 'image' ? ImageIcon : kind === 'code' ? CodeIcon : kind === 'sheet' ? BoxIcon : FileIcon
  return (
    <div className="p-4 border rounded-t-2xl flex flex-col gap-2 dark:bg-muted border-b-0 dark:border-zinc-700">
      <div className="flex flex-row items-center gap-3">
        <div className="text-muted-foreground"><Icon/></div>
        <div className="font-medium">{title}</div>
      </div>
      <p className="text-sm text-muted-foreground ml-9 -mt-2">{description}</p>
    </div>
  )
})

// END OF: components/artifact-preview.tsx
