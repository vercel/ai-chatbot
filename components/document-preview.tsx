/**
 * @file components/document-preview.tsx
 * @description Компоненты для отображения превью документов в чате. Реализует ленивую загрузку и легковесные превью.
 * @version 1.2.0
 * @date 2025-06-07
 * @updated Реализован диспетчер превью, показывающий саммари для текстовых артефактов и ImageEditor для картинок.
 */

/** HISTORY:
 * v1.2.0 (2025-06-07): Рефакторинг для показа легковесных превью (саммари) вместо полных редакторов.
 * v1.1.0 (2025-06-06): Добавлена логика ленивой загрузки контента с отображением скелетона.
 * v1.0.0 (2025-06-06): Начальная версия компонента.
 */
import { memo, type MouseEvent, useCallback, useEffect, useMemo, useRef, } from 'react'
import type { ArtifactKind, UIArtifact } from './artifact'
import { BoxIcon, CodeIcon, FileIcon, FullscreenIcon, ImageIcon, LoaderIcon } from './icons'
import { cn, fetcher } from '@/lib/utils'
import type { Document } from '@/lib/db/schema'
import { InlineDocumentSkeleton } from './document-skeleton'
import useSWR from 'swr'
import { DocumentToolCall, DocumentToolResult } from './document'
import { useArtifact } from '@/hooks/use-artifact'
import equal from 'fast-deep-equal'
import { ImageEditor } from './image-editor'
import { toast } from './toast'

interface DocumentPreviewProps {
  isReadonly: boolean;
  result?: any;
  args?: any;
}

export function DocumentPreview ({
  isReadonly,
  result,
  args,
}: DocumentPreviewProps) {
  const { artifact, setArtifact } = useArtifact()
  const documentId = result?.id ?? args?.id ?? artifact.documentId

  const { data: documents, isLoading: isDocumentsFetching, mutate } = useSWR<
    Array<Document>
  >(documentId ? `/api/document?id=${documentId}` : null, fetcher, {
    // Включаем периодическую перепроверку для подгрузки саммари
    refreshInterval: (data) => (data && data.length > 0 && !data[data.length - 1].summary ? 3000 : 0),
  })

  const previewDocument = useMemo(() => documents?.[documents.length - 1], [documents])
  const hitboxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const boundingBox = hitboxRef.current?.getBoundingClientRect()

    if (artifact.documentId && boundingBox) {
      setArtifact((artifact) => ({
        ...artifact,
        boundingBox: {
          left: boundingBox.x,
          top: boundingBox.y,
          width: boundingBox.width,
          height: boundingBox.height,
        },
      }))
    }
  }, [artifact.documentId, setArtifact])

  if (artifact.isVisible && artifact.documentId === documentId) {
    if (result) {
      return (
        <DocumentToolResult
          type="create"
          result={{ id: result.id, title: result.title, kind: result.kind }}
          isReadonly={isReadonly}
        />
      )
    }
    if (args) {
      return (
        <DocumentToolCall
          type="create"
          args={{ title: args.title }}
          isReadonly={isReadonly}
        />
      )
    }
  }

  if (isDocumentsFetching && !previewDocument) {
    return <LoadingSkeleton artifactKind={result?.kind ?? args?.kind ?? artifact.kind}/>
  }

  const document: Document | null = previewDocument ?? null

  if (!document) return <LoadingSkeleton artifactKind={result?.kind ?? args?.kind ?? artifact.kind}/>

  return (
    <div className="relative w-full cursor-pointer">
      <HitboxLayer
        hitboxRef={hitboxRef}
        document={document}
        setArtifact={setArtifact}
      />
      <DocumentHeader
        title={document.title}
        kind={document.kind as ArtifactKind}
        isStreaming={artifact.status === 'streaming' && artifact.documentId === documentId}
      />
      <DocumentContent document={document}/>
    </div>
  )
}

const LoadingSkeleton = ({ artifactKind }: { artifactKind: ArtifactKind }) => (
  <div className="w-full">
    <div
      className="p-4 border rounded-t-2xl flex flex-row gap-2 items-center justify-between dark:bg-muted h-[57px] dark:border-zinc-700 border-b-0">
      <div className="flex flex-row items-center gap-3">
        <div className="text-muted-foreground">
          <div className="animate-pulse rounded-md size-4 bg-muted-foreground/20"/>
        </div>
        <div className="animate-pulse rounded-lg h-4 bg-muted-foreground/20 w-24"/>
      </div>
      <div>
        <FullscreenIcon/>
      </div>
    </div>
    <div className="overflow-y-scroll border rounded-b-2xl p-8 pt-4 bg-muted border-t-0 dark:border-zinc-700 h-[257px]">
      <InlineDocumentSkeleton/>
    </div>
  </div>
)

const PureHitboxLayer = ({
  hitboxRef,
  document,
  setArtifact,
}: {
  hitboxRef: React.RefObject<HTMLDivElement>;
  document: Document;
  setArtifact: (
    updaterFn: UIArtifact | ((currentArtifact: UIArtifact) => UIArtifact),
  ) => void;
}) => {
  const handleClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      const boundingBox = event.currentTarget.getBoundingClientRect()
      toast({ type: 'loading', description: `Открываю артефакт "${document.title}"...` })
      setArtifact({
        documentId: document.id,
        kind: document.kind as ArtifactKind,
        title: document.title,
        content: document.content ?? '',
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
    },
    [setArtifact, document],
  )

  return (
    <div
      className="size-full absolute top-0 left-0 rounded-xl z-10"
      ref={hitboxRef}
      onClick={handleClick}
      role="presentation"
      aria-hidden="true"
    >
      <div className="w-full p-4 flex justify-end items-center">
        <div className="absolute right-[9px] top-[13px] p-2 hover:dark:bg-zinc-700 rounded-md hover:bg-zinc-100">
          <FullscreenIcon/>
        </div>
      </div>
    </div>
  )
}

const HitboxLayer = memo(PureHitboxLayer, (prevProps, nextProps) => {
  if (!equal(prevProps.document.id, nextProps.document.id)) return false
  return true
})

const PureDocumentHeader = ({
  title,
  kind,
  isStreaming,
}: {
  title: string;
  kind: ArtifactKind;
  isStreaming: boolean;
}) => {
  const Icon =
    kind === 'image' ? ImageIcon :
      kind === 'code' ? CodeIcon :
        kind === 'sheet' ? BoxIcon :
          FileIcon

  return (
    <div
      className="p-4 border rounded-t-2xl flex flex-row gap-2 items-start sm:items-center justify-between dark:bg-muted border-b-0 dark:border-zinc-700">
      <div className="flex flex-row items-start sm:items-center gap-3">
        <div className="text-muted-foreground">
          {isStreaming ? (
            <div className="animate-spin">
              <LoaderIcon/>
            </div>
          ) : (
            <Icon/>
          )}
        </div>
        <div className="-translate-y-1 sm:translate-y-0 font-medium">{title}</div>
      </div>
      <div className="w-8"/>
    </div>
  )
}

const DocumentHeader = memo(PureDocumentHeader, (prevProps, nextProps) => {
  if (prevProps.title !== nextProps.title) return false
  if (prevProps.isStreaming !== nextProps.isStreaming) return false

  return true
})

const DocumentContent = ({ document }: { document: Document }) => {
  const { artifact } = useArtifact()
  const kind = document.kind as ArtifactKind

  const containerClassName = cn(
    'h-[257px] overflow-y-scroll border rounded-b-2xl dark:bg-muted border-t-0 dark:border-zinc-700',
    {
      'p-6': kind !== 'image',
    }
  )

  return (
    <div className={containerClassName}>
      {kind === 'image' ? (
        <ImageEditor
          title={document.title}
          content={document.content ?? ''}
          status={artifact.status}
          isInline={true}
        />
      ) : (
        <div className="prose dark:prose-invert prose-sm">
          {document.summary ? (
            <p className="text-muted-foreground italic">{document.summary}</p>
          ) : (
            <div className="space-y-2">
              <div className="animate-pulse rounded-lg h-4 bg-muted-foreground/20 w-3/4"/>
              <div className="animate-pulse rounded-lg h-4 bg-muted-foreground/20 w-1/2"/>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
// END OF: components/document-preview.tsx
