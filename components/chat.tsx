'use client';

import type { Attachment, UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import { ChatHeader } from '@/components/chat-header';
import type { Vote, Document as DBDocument } from '@/lib/db/schema';
import { fetcher, generateUUID } from '@/lib/utils';
import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import type { VisibilityType } from './visibility-selector';
import {
  useArtifact,
  useArtifactSelector,
  initialArtifactData,
} from '@/hooks/use-artifact';
import { toast } from 'sonner';
import { unstable_serialize } from 'swr/infinite';

// Define the shape of the document prop expected from the server
// Use a subset matching what's selected in page.tsx
type InitialDocumentProp = Pick<
  DBDocument,
  'id' | 'title' | 'kind' | 'content'
> | null;

export function Chat({
  id,
  initialMessages,
  initialAssociatedDocument,
  selectedChatModel,
  selectedVisibilityType,
  isReadonly,
}: {
  id: string;
  initialMessages: Array<UIMessage>;
  initialAssociatedDocument?: InitialDocumentProp;
  selectedChatModel: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const { mutate } = useSWRConfig();
  const [isN8nProcessing, setIsN8nProcessing] = useState(false);

  const {
    messages,
    setMessages,
    handleSubmit: originalUseChatHandleSubmit,
    input,
    setInput,
    append,
    status,
    stop,
    reload,
  } = useChat({
    id,
    body: { id, selectedChatModel: selectedChatModel },
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    onFinish: () => {
      console.log(
        '[Chat] onFinish called. selectedChatModel:',
        selectedChatModel,
      );
      console.log('[Chat] onFinish status:', status);
      if (!isN8nProcessing) {
        // mutate(unstable_serialize(getChatHistoryPaginationKey)); // Example, adapt if needed
      }
    },
    onError: (error) => {
      console.error(
        '[Chat] onError called. selectedChatModel:',
        selectedChatModel,
      );
      console.error('[Chat] onError details:', error);
      console.error('[Chat] onError status:', status);
      toast.error('An error occurred, please try again!');
      if (selectedChatModel === 'n8n-assistant' && isN8nProcessing) {
        setIsN8nProcessing(false);
      }
    },
  });

  const { data: votes } = useSWR<Array<Vote>>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  const { setArtifact } = useArtifact();
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleSubmitIntercept: typeof originalUseChatHandleSubmit = (
    eventOrOptions,
    optionsBundle,
  ) => {
    const n8nSelectedNow = selectedChatModel === 'n8n-assistant';
    let isNewUserSubmitIntent = false;

    // Case 1: Form submission event (eventOrOptions is a form event)
    if (
      eventOrOptions &&
      typeof (eventOrOptions as React.FormEvent<HTMLFormElement>)
        .preventDefault === 'function'
    ) {
      if (input.trim() !== '') {
        isNewUserSubmitIntent = true;
      }
    }
    // Case 2: Not a form event, BUT there is input.
    else if (input.trim() !== '') {
      if (
        eventOrOptions &&
        typeof eventOrOptions === 'object' &&
        (eventOrOptions as any).messages &&
        Array.isArray((eventOrOptions as any).messages)
      ) {
        const messagesInSubmit = (eventOrOptions as any)
          .messages as UIMessage[];
        if (
          messagesInSubmit.length > 0 &&
          messagesInSubmit[messagesInSubmit.length - 1].role === 'user'
        ) {
          isNewUserSubmitIntent = true;
        } else {
          isNewUserSubmitIntent = true; // Fallback to input driving the intent
        }
      } else {
        isNewUserSubmitIntent = true;
      }
    }

    if (n8nSelectedNow && isNewUserSubmitIntent) {
      if (!isN8nProcessing) {
        setIsN8nProcessing(true);
      }
    }

    if (typeof optionsBundle !== 'undefined') {
      originalUseChatHandleSubmit(
        eventOrOptions as React.FormEvent<HTMLFormElement>,
        optionsBundle,
      );
    } else {
      originalUseChatHandleSubmit(eventOrOptions as any);
    }
  };

  const displayStatus = isN8nProcessing ? 'submitted' : status;

  const { data: freshMessages } = useSWR(
    isN8nProcessing ? `/api/messages-test?chatId=${id}` : null,
    fetcher,
    { refreshInterval: 3000 },
  );

  useEffect(() => {
    if (freshMessages && freshMessages.length > 0) {
      const currentMessageIds = new Set(messages.map((m) => m.id));
      const newUIMessages = freshMessages
        .map((dbMessage: any) => {
          if (
            !dbMessage ||
            typeof dbMessage !== 'object' ||
            !dbMessage.id ||
            !dbMessage.role
          ) {
            console.warn(
              '[Chat DEBUG] Invalid dbMessage structure:',
              dbMessage,
            );
            return null;
          }

          const finalParts =
            typeof dbMessage.parts === 'string'
              ? JSON.parse(dbMessage.parts)
              : dbMessage.parts || [];

          const finalAttachments =
            typeof dbMessage.attachments === 'string'
              ? JSON.parse(dbMessage.attachments)
              : dbMessage.attachments || [];

          let messageContent = '';
          if (finalParts.length > 0 && finalParts[0]?.type === 'text') {
            messageContent = finalParts[0].text;
          }

          return {
            id: dbMessage.id,
            role: dbMessage.role as
              | 'user'
              | 'assistant'
              | 'system'
              | 'function'
              | 'tool'
              | 'data',
            content: messageContent,
            parts: finalParts,
            experimental_attachments: finalAttachments,
            createdAt: new Date(dbMessage.createdAt),
          };
        })
        .filter(Boolean);

      let appendedNewMessages = false;
      newUIMessages.forEach((uiMsg: UIMessage) => {
        if (uiMsg.role === 'assistant' && !currentMessageIds.has(uiMsg.id)) {
          append(uiMsg);
          appendedNewMessages = true;
        }
      });

      if (appendedNewMessages) {
        setIsN8nProcessing(false);
      }
    }
  }, [
    freshMessages,
    append,
    messages,
    selectedChatModel,
    isN8nProcessing,
    setIsN8nProcessing,
  ]);

  useEffect(() => {
    if (initialAssociatedDocument) {
      setArtifact({
        isVisible: true,
        documentId: initialAssociatedDocument.id,
        title: initialAssociatedDocument.title,
        kind: initialAssociatedDocument.kind as any,
        content: initialAssociatedDocument.content || '',
        status: 'idle',
        boundingBox: initialArtifactData.boundingBox,
      });
    } else {
      setArtifact({ ...initialArtifactData, isVisible: false });
    }
  }, [initialAssociatedDocument, setArtifact]);

  if (isN8nProcessing && !freshMessages) {
    const swrKey = `/api/messages-test?chatId=${id}`;
    mutate(swrKey, undefined, { revalidate: false });
  }

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader
          chatId={id}
          selectedModelId={selectedChatModel}
          selectedVisibilityType={selectedVisibilityType}
          isReadonly={isReadonly}
        />

        <Messages
          chatId={id}
          status={displayStatus}
          votes={votes}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          isArtifactVisible={isArtifactVisible}
        />

        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          {!isReadonly && (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmitIntercept}
              status={status}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setMessages}
              append={append}
            />
          )}
        </form>
      </div>

      {isArtifactVisible && (
        <Artifact
          chatId={id}
          input={input}
          setInput={setInput}
          handleSubmit={handleSubmitIntercept}
          status={status}
          stop={stop}
          attachments={attachments}
          setAttachments={setAttachments}
          append={append}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          votes={votes}
          isReadonly={isReadonly}
        />
      )}
    </>
  );
}
