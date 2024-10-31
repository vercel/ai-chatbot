import { Attachment, ChatRequestOptions, CreateMessage, Message } from 'ai';
import cx from 'classnames';
import { formatDistance, isAfter } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from 'react';
import useSWR, { useSWRConfig } from 'swr';

import { Document, Suggestion } from '@/db/schema';
import { fetcher } from '@/lib/utils';

import { DiffView } from './diffview';
import { DocumentSkeleton } from './document-skeleton';
import { Editor } from './editor';
import { CrossIcon, DeltaIcon, RedoIcon, UndoIcon } from './icons';
import { Message as PreviewMessage } from './message';
import { MultimodalInput } from './multimodal-input';
import { Toolbar } from './toolbar';
import { useDebounce } from './use-debounce';
import { useScrollToBottom } from './use-scroll-to-bottom';
import useWindowSize from './use-window-size';
import { Button } from '../ui/button';

export interface UICanvas {
  title: string;
  documentId: string;
  content: string;
  isVisible: boolean;
  status: 'streaming' | 'idle';
  boundingBox: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

export function Canvas({
  input,
  setInput,
  handleSubmit,
  isLoading,
  stop,
  attachments,
  setAttachments,
  append,
  canvas,
  setCanvas,
  messages,
  setMessages,
}: {
  input: string;
  setInput: (input: string) => void;
  isLoading: boolean;
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  canvas: UICanvas;
  setCanvas: Dispatch<SetStateAction<UICanvas | null>>;
  messages: Array<Message>;
  setMessages: Dispatch<SetStateAction<Array<Message>>>;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions
  ) => Promise<string | null | undefined>;
  handleSubmit: (
    event?: {
      preventDefault?: () => void;
    },
    chatRequestOptions?: ChatRequestOptions
  ) => void;
}) {
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  const {
    data: documents,
    isLoading: isDocumentsFetching,
    isValidating: isDocumentsValidating,
    mutate: mutateDocuments,
  } = useSWR<Array<Document>>(
    canvas && canvas.status !== 'streaming'
      ? `/api/document?id=${canvas.documentId}`
      : null,
    fetcher
  );

  const { data: suggestions } = useSWR<Array<Suggestion>>(
    documents && canvas && canvas.status !== 'streaming'
      ? `/api/suggestions?documentId=${canvas.documentId}`
      : null,
    fetcher,
    {
      dedupingInterval: 5000,
    }
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
        setCanvas((currentCanvas) =>
          currentCanvas
            ? {
                ...currentCanvas,
                content: mostRecentDocument.content ?? '',
              }
            : null
        );
      }
    }
  }, [documents, setCanvas]);

  useEffect(() => {
    mutateDocuments();
  }, [canvas.status, mutateDocuments]);

  const { mutate } = useSWRConfig();
  const [isContentDirty, setIsContentDirty] = useState(false);

  const handleContentChange = useCallback(
    (updatedContent: string) => {
      if (!canvas) return;

      mutate<Array<Document>>(
        `/api/document?id=${canvas.documentId}`,
        async (currentDocuments) => {
          if (!currentDocuments) return undefined;

          const currentDocument = currentDocuments.at(-1);

          if (!currentDocument || !currentDocument.content) {
            setIsContentDirty(false);
            return currentDocuments;
          }

          if (currentDocument.content !== updatedContent) {
            await fetch(`/api/document?id=${canvas.documentId}`, {
              method: 'POST',
              body: JSON.stringify({
                title: canvas.title,
                content: updatedContent,
              }),
            });

            setIsContentDirty(false);

            const newDocument = {
              ...currentDocument,
              content: updatedContent,
              createdAt: new Date(),
            };

            return [...currentDocuments, newDocument];
          } else {
            return currentDocuments;
          }
        },
        { revalidate: false }
      );
    },
    [canvas, mutate]
  );

  const debouncedHandleEditorChange = useCallback(
    useDebounce(handleContentChange, 4000),
    [handleContentChange]
  );

  const handleEditorChange = useCallback(
    (updatedContent: string, debounce: boolean) => {
      if (document && updatedContent !== document.content) {
        if (debounce) {
          debouncedHandleEditorChange(updatedContent);
        } else {
          handleContentChange(updatedContent);
        }

        setIsContentDirty(true);
      }
    },
    [document, debouncedHandleEditorChange, handleContentChange]
  );

  function getDocumentContentById(index: number) {
    if (!documents) return '';
    if (!documents[index]) return '';
    return documents[index].content ?? '';
  }

  function getDocumentTimestampById(index: number) {
    if (!documents) return '';
    return documents[index]?.createdAt ?? '';
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

  const [isToolbarVisible, setIsToolbarVisible] = useState(false);

  /*
   * NOTE: if there are no documents, or if
   * the documents are being fetched, then
   * we mark it as the current version.
   */

  const isCurrentVersion =
    isDocumentsFetching || isDocumentsValidating
      ? true
      : documents && documents.length > 0
        ? currentVersionIndex === documents.length - 1
        : true;

  const { width: windowWidth, height: windowHeight } = useWindowSize();
  const isMobile = windowWidth ? windowWidth < 768 : false;

  return (
    <motion.div
      className="flex flex-row h-dvh w-dvw fixed top-0 left-0 z-50 bg-muted"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { delay: 0.4 } }}
    >
      {!isMobile && (
        <motion.div
          className="relative w-[400px] bg-muted dark:bg-background h-dvh shrink-0"
          initial={{ opacity: 0, x: 10, scale: 1 }}
          animate={{
            opacity: 1,
            x: 0,
            scale: 1,
            transition: {
              delay: 0.2,
              type: 'spring',
              stiffness: 200,
              damping: 30,
            },
          }}
          exit={{ opacity: 0, x: 10, scale: 0.95, transition: { delay: 0 } }}
        >
          <AnimatePresence>
            {!isCurrentVersion && (
              <motion.div
                className="left-0 absolute h-dvh w-[400px] top-0 bg-zinc-900/50 z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            )}
          </AnimatePresence>

          <div className="flex flex-col h-full justify-between items-center gap-4">
            <div
              ref={messagesContainerRef}
              className="flex flex-col gap-4 h-full items-center overflow-y-scroll px-4 pt-20"
            >
              {messages.map((message) => (
                <PreviewMessage
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  attachments={message.experimental_attachments}
                  toolInvocations={message.toolInvocations}
                  canvas={canvas}
                  setCanvas={setCanvas}
                />
              ))}

              <div
                ref={messagesEndRef}
                className="shrink-0 min-w-[24px] min-h-[24px]"
              />
            </div>

            <form className="flex flex-row gap-2 relative items-end w-full px-4 pb-4">
              <MultimodalInput
                input={input}
                setInput={setInput}
                handleSubmit={handleSubmit}
                isLoading={isLoading}
                stop={stop}
                attachments={attachments}
                setAttachments={setAttachments}
                messages={messages}
                append={append}
                className="bg-background dark:bg-muted"
                setMessages={setMessages}
              />
            </form>
          </div>
        </motion.div>
      )}

      <motion.div
        className="fixed dark:bg-muted bg-background h-dvh flex flex-col shadow-xl overflow-y-scroll"
        initial={
          isMobile
            ? {
                opacity: 0,
                x: 0,
                y: 0,
                width: windowWidth,
                height: windowHeight,
                borderRadius: 50,
              }
            : {
                opacity: 0,
                x: canvas.boundingBox.left,
                y: canvas.boundingBox.top,
                height: canvas.boundingBox.height,
                width: canvas.boundingBox.width,
                borderRadius: 50,
              }
        }
        animate={
          isMobile
            ? {
                opacity: 1,
                x: 0,
                y: 0,
                width: windowWidth,
                height: '100dvh',
                borderRadius: 0,
                transition: {
                  delay: 0,
                  type: 'spring',
                  stiffness: 200,
                  damping: 30,
                },
              }
            : {
                opacity: 1,
                x: 400,
                y: 0,
                height: windowHeight,
                width: windowWidth ? windowWidth - 400 : 'calc(100dvw-400px)',
                borderRadius: 0,
                transition: {
                  delay: 0,
                  type: 'spring',
                  stiffness: 200,
                  damping: 30,
                },
              }
        }
        exit={{
          opacity: 0,
          scale: 0.5,
          transition: {
            delay: 0.1,
            type: 'spring',
            stiffness: 600,
            damping: 30,
          },
        }}
      >
        <div className="p-2 flex flex-row justify-between items-start">
          <div className="flex flex-row gap-4 items-start">
            <div
              className="cursor-pointer hover:bg-muted dark:hover:bg-zinc-700 p-2 rounded-lg text-muted-foreground"
              onClick={() => {
                setCanvas(null);
              }}
            >
              <CrossIcon size={18} />
            </div>

            <div className="flex flex-col pt-1">
              <div className="font-medium">
                {document?.title ?? canvas.title}
              </div>

              {isContentDirty ? (
                <div className="text-sm text-muted-foreground">
                  Saving changes...
                </div>
              ) : document ? (
                <div className="text-sm text-muted-foreground">
                  {`Updated ${formatDistance(
                    new Date(document.createdAt),
                    new Date(),
                    {
                      addSuffix: true,
                    }
                  )}`}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-row gap-1">
            <div
              className="cursor-pointer hover:bg-muted p-2 rounded-lg text-muted-foreground dark:hover:bg-zinc-700"
              onClick={() => {
                handleVersionChange('prev');
              }}
            >
              <UndoIcon size={18} />
            </div>
            <div
              className="cursor-pointer hover:bg-muted p-2 rounded-lg text-muted-foreground dark:hover:bg-zinc-700"
              onClick={() => {
                handleVersionChange('next');
              }}
            >
              <RedoIcon size={18} />
            </div>
            <div
              className={cx(
                'cursor-pointer hover:bg-muted p-2 rounded-lg text-muted-foreground dark:hover:bg-zinc-700',
                { 'bg-muted dark:bg-zinc-700': mode === 'diff' }
              )}
              onClick={() => {
                handleVersionChange('toggle');
              }}
            >
              <DeltaIcon size={18} />
            </div>
          </div>
        </div>

        <div className="prose dark:prose-invert dark:bg-muted bg-background h-full overflow-y-scroll px-4 py-8 md:p-20 !max-w-full pb-40 items-center">
          <div className="flex flex-row max-w-[600px] mx-auto">
            {isDocumentsFetching && !canvas.content ? (
              <DocumentSkeleton />
            ) : mode === 'edit' ? (
              <Editor
                content={
                  isCurrentVersion
                    ? canvas.content
                    : getDocumentContentById(currentVersionIndex)
                }
                currentVersionIndex={currentVersionIndex}
                status={canvas.status ?? 'idle'}
                onChange={handleEditorChange}
                suggestions={isCurrentVersion ? (suggestions ?? []) : []}
                append={append}
              />
            ) : (
              <DiffView
                oldContent={getDocumentContentById(currentVersionIndex - 1)}
                newContent={getDocumentContentById(currentVersionIndex)}
              />
            )}

            {suggestions ? (
              <div className="md:hidden h-dvh w-12 shrink-0" />
            ) : null}
          </div>
        </div>

        <AnimatePresence>
          {!isCurrentVersion && (
            <motion.div
              className="absolute flex flex-col gap-4 lg:flex-row bottom-0 bg-background p-4 w-full border-t z-50 justify-between"
              initial={{ y: isMobile ? 200 : 77 }}
              animate={{ y: 0 }}
              exit={{ y: isMobile ? 200 : 77 }}
              transition={{ type: 'spring', stiffness: 140, damping: 20 }}
            >
              <div>
                <div>You are viewing a previous version</div>
                <div className="text-muted-foreground text-sm">
                  Restore this version to make edits
                </div>
              </div>

              <div className="flex flex-row gap-4">
                <Button
                  onClick={async () => {
                    mutate(
                      `/api/document?id=${canvas.documentId}`,
                      await fetch(`/api/document?id=${canvas.documentId}`, {
                        method: 'PATCH',
                        body: JSON.stringify({
                          timestamp:
                            getDocumentTimestampById(currentVersionIndex),
                        }),
                      }),
                      {
                        optimisticData: documents
                          ? [
                              ...documents.filter((d) =>
                                isAfter(
                                  new Date(d.createdAt),
                                  new Date(
                                    getDocumentTimestampById(
                                      currentVersionIndex
                                    )
                                  )
                                )
                              ),
                            ]
                          : [],
                      }
                    );
                  }}
                >
                  Restore this version
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleVersionChange('latest');
                  }}
                >
                  Back to latest version
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {isCurrentVersion && (
          <Toolbar
            isToolbarVisible={isToolbarVisible}
            setIsToolbarVisible={setIsToolbarVisible}
            append={append}
            isLoading={isLoading}
            stop={stop}
            setMessages={setMessages}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
