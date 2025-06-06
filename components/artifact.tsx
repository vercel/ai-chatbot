/**
 * @file components/artifact.tsx
 * @description Основной компонент-контейнер для артефакта.
 * @version 1.3.2
 * @date 2025-06-06
 * @updated Исправлена ошибка типизации (TS2739): добавлены недостающие пропсы в компонент Toolbar.
 */

/** HISTORY:
 * v1.3.2 (2025-06-06): Добавлены недостающие пропсы в Toolbar.
 * v1.3.1 (2025-06-06): Исправлен тип 'status' для Toolbar.
 * v1.3.0 (2025-06-05): Исправлена логика кнопки fullscreen.
 * v1.2.0 (2025-06-05): Удалены классы `fixed`, `top`, `right` и т.д. для работы в Flexbox-макете.
 * v1.1.0 (2025-06-05): Добавлена кнопка переключения displayMode и логика для split/full view.
 * v1.0.0 (2025-05-25): Начальная версия компонента.
 */
import type { Attachment, UIMessage } from 'ai';
import { formatDistance } from 'date-fns';
import {
  type Dispatch,
  memo,
  type SetStateAction,
  useCallback,
  useEffect,
  useState,
} from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { useDebounceCallback, useWindowSize } from 'usehooks-ts';
import type { Document, Vote } from '@/lib/db/schema';
import { fetcher } from '@/lib/utils';
import { Toolbar } from './toolbar';
import { VersionFooter } from './version-footer';
import { ArtifactActions } from './artifact-actions';
import { ArtifactCloseButton } from './artifact-close-button';
import { useArtifact } from '@/hooks/use-artifact';
import { imageArtifact } from '@/artifacts/image/client';
import { codeArtifact } from '@/artifacts/code/client';
import { sheetArtifact } from '@/artifacts/sheet/client';
import { textArtifact } from '@/artifacts/text/client';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { FullscreenIcon } from './icons';
import { cn } from '@/lib/utils';
import type { Session } from 'next-auth';

export const artifactDefinitions = [
  textArtifact,
  codeArtifact,
  imageArtifact,
  sheetArtifact,
];
export type ArtifactKind = (typeof artifactDefinitions)[number]['kind'];
export type ArtifactDisplayMode = 'split' | 'full';

export interface UIArtifact {
  title: string;
  documentId: string;
  kind: ArtifactKind;
  content: string;
  isVisible: boolean;
  status: 'streaming' | 'idle';
  displayMode: ArtifactDisplayMode;
  boundingBox: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

function PureArtifact({
  chatId,
  append,
  status,
  stop,
  setMessages,
  session,
}: {
  chatId: string;
  input: string;
  setInput: UseChatHelpers['setInput'];
  status: UseChatHelpers['status'];
  stop: UseChatHelpers['stop'];
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers['setMessages'];
  votes: Array<Vote> | undefined;
  append: UseChatHelpers['append'];
  handleSubmit: UseChatHelpers['handleSubmit'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
  selectedVisibilityType: 'private' | 'public';
  session: Session | null
}) {
  const { artifact, setArtifact, metadata, setMetadata, toggleDisplayMode } = useArtifact();
  const [isToolbarVisible, setIsToolbarVisible] = useState(false);

  const {
    data: documents,
    isLoading: isDocumentsFetching,
    mutate: mutateDocuments,
  } = useSWR<Array<Document>>(
    artifact.documentId !== 'init' && artifact.status !== 'streaming'
      ? `/api/document?id=${artifact.documentId}`
      : null,
    fetcher,
  );

  const [mode, setMode] = useState<'edit' | 'diff'>('edit');
  const [document, setDocument] = useState<Document | null>(null);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(-1);

  useEffect(() => {
    if (documents && documents.length > 0) {
      const mostRecentDocument = documents.at(-1);

      if (mostRecentDocument) {
        setDocument(mostRecentDocument);
        setCurrentVersionIndex(documents.length - 1);
        setArtifact((currentArtifact) => ({
          ...currentArtifact,
          content: mostRecentDocument.content ?? '',
        }));
      }
    }
  }, [documents, setArtifact]);

  useEffect(() => {
    mutateDocuments();
  }, [artifact.status, mutateDocuments]);

  const { mutate } = useSWRConfig();
  const [isContentDirty, setIsContentDirty] = useState(false);

  const handleContentChange = useCallback(
    (updatedContent: string) => {
      if (!artifact) return;

      mutate<Array<Document>>(
        `/api/document?id=${artifact.documentId}`,
        async (currentDocuments) => {
          if (!currentDocuments) return undefined;

          const currentDocument = currentDocuments.at(-1);

          if (!currentDocument || !currentDocument.content) {
            setIsContentDirty(false);
            return currentDocuments;
          }

          if (currentDocument.content !== updatedContent) {
            await fetch(`/api/document?id=${artifact.documentId}`, {
              method: 'POST',
              body: JSON.stringify({
                title: artifact.title,
                content: updatedContent,
                kind: artifact.kind,
              }),
            });

            setIsContentDirty(false);

            const newDocument = {
              ...currentDocument,
              content: updatedContent,
              createdAt: new Date(),
            };

            return [...currentDocuments, newDocument];
          }
          return currentDocuments;
        },
        { revalidate: false },
      );
    },
    [artifact, mutate],
  );

  const debouncedHandleContentChange = useDebounceCallback(
    handleContentChange,
    2000,
  );

  const saveContent = useCallback(
    (updatedContent: string, debounce: boolean) => {
      if (document && updatedContent !== document.content) {
        setIsContentDirty(true);

        if (debounce) {
          debouncedHandleContentChange(updatedContent);
        } else {
          handleContentChange(updatedContent);
        }
      }
    },
    [document, debouncedHandleContentChange, handleContentChange],
  );

  function getDocumentContentById(index: number) {
    if (!documents) return '';
    if (!documents[index]) return '';
    return documents[index].content ?? '';
  }

  const handleVersionChange = (type: 'next' | 'prev' | 'toggle' | 'latest') => {
    if (!documents) return;

    if (type === 'latest') {
      setCurrentVersionIndex(documents.length - 1);
      setMode('edit');
    }

    if (type === 'toggle') {
      setMode((mode) => (mode === 'edit' ? 'diff' : 'edit'));
    }

    if (type === 'prev') {
      if (currentVersionIndex > 0) {
        setCurrentVersionIndex((index) => index - 1);
      }
    } else if (type === 'next') {
      if (currentVersionIndex < documents.length - 1) {
        setCurrentVersionIndex((index) => index + 1);
      }
    }
  };

  const isCurrentVersion =
    documents && documents.length > 0
      ? currentVersionIndex === documents.length - 1
      : true;

  const { width: windowWidth } = useWindowSize();
  const isMobile = windowWidth ? windowWidth < 768 : false;

  const artifactDefinition = artifactDefinitions.find(
    (definition) => definition.kind === artifact.kind,
  );

  useEffect(() => {
    if (artifact.documentId !== 'init' && artifactDefinition?.initialize) {
      artifactDefinition.initialize({
        documentId: artifact.documentId,
        setMetadata,
      });
    }
  }, [artifact.documentId, artifactDefinition, setMetadata]);

  if (!artifactDefinition || !artifact.isVisible || isMobile) {
    return null;
  }

  return (
    <div
      data-testid="artifact"
      className="flex flex-col h-full w-full bg-background border-l dark:border-zinc-700"
    >
      <div className="p-2 flex flex-row justify-between items-start border-b dark:border-zinc-700">
          <div className="flex flex-row gap-4 items-start">
            <ArtifactCloseButton />

            <div className="flex flex-col">
              <div className="font-medium">{artifact.title}</div>
              {isContentDirty ? (
                <div className="text-sm text-muted-foreground">Saving changes...</div>
              ) : document ? (
                <div className="text-sm text-muted-foreground">
                  {`Updated ${formatDistance(new Date(document.createdAt), new Date(), { addSuffix: true })}`}
                </div>
              ) : (
                <div className="w-32 h-3 mt-2 bg-muted-foreground/20 rounded-md animate-pulse" />
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" className="h-fit p-2 dark:hover:bg-zinc-700" onClick={toggleDisplayMode}>
                  <FullscreenIcon size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{artifact.displayMode === 'split' ? 'Enter Fullscreen' : 'Exit Fullscreen'}</TooltipContent>
            </Tooltip>

            <ArtifactActions
              artifact={artifact}
              currentVersionIndex={currentVersionIndex}
              handleVersionChange={handleVersionChange}
              isCurrentVersion={isCurrentVersion}
              mode={mode}
              metadata={metadata}
              setMetadata={setMetadata}
            />
          </div>
        </div>

        <div className="dark:bg-muted bg-background h-full overflow-y-scroll !max-w-full items-center">
          <artifactDefinition.content
            title={artifact.title}
            content={
              isCurrentVersion
                ? artifact.content
                : getDocumentContentById(currentVersionIndex)
            }
            mode={mode}
            status={artifact.status}
            currentVersionIndex={currentVersionIndex}
            suggestions={[]}
            onSaveContent={saveContent}
            isInline={false}
            isCurrentVersion={isCurrentVersion}
            getDocumentContentById={getDocumentContentById}
            isLoading={isDocumentsFetching && !artifact.content}
            metadata={metadata}
            setMetadata={setMetadata}
          />

          {isCurrentVersion && <Toolbar
              append={append}
              status={status}
              artifactKind={artifact.kind}
              isToolbarVisible={isToolbarVisible}
              setIsToolbarVisible={setIsToolbarVisible}
              stop={stop}
              setMessages={setMessages}
            />}
        </div>

        {!isCurrentVersion && (
            <VersionFooter
              currentVersionIndex={currentVersionIndex}
              documents={documents}
              handleVersionChange={handleVersionChange}
            />
          )}
    </div>
  );
}

export const Artifact = memo(PureArtifact, (prevProps, nextProps) => equal(prevProps, nextProps));

// END OF: components/artifact.tsx
