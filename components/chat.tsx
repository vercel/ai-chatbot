'use client';

import type { Attachment, UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import type { UseChatHelpers } from '@ai-sdk/react';
import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import { ChatHeader } from '@/components/chat-header';
import type { Vote, Document as DBDocument } from '@/lib/db/schema';
import { fetcher, generateUUID, isN8nModel } from '@/lib/utils';
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
  // const { mutate } = useSWRConfig(); // Keep mutate import for now if needed elsewhere, but comment out its use here

  const {
    messages,
    setMessages,
    handleSubmit,
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
      console.log('[Chat] onFinish called. Skipping SWR history mutate.'); // Add log
      //   revalidate: false,
      // });

      // COMMENT OUT THIS LINE
      // mutate(unstable_serialize(getChatHistoryPaginationKey)); // Needs to be adapted if history structure changes
    },
    onError: (error) => {
      // Add error logging
      console.error('[Chat] onError called:', error);
      toast.error('An error occurred, please try again!');
    },
  });

  // Custom handleSubmit wrapper for N8N models
  const customHandleSubmit: UseChatHelpers['handleSubmit'] = (
    event,
    options,
  ) => {
    console.log(
      '[Chat] CustomHandleSubmit called for model:',
      selectedChatModel,
    );

    if (isN8nModel(selectedChatModel)) {
      console.log('[Chat] N8N model detected, starting thinking animation');
      setIsN8nThinking(true);
    }

    // Call original handleSubmit
    return handleSubmit(event, options);
  };

  const { data: votes } = useSWR<Array<Vote>>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  // N8N state management
  const [isN8nThinking, setIsN8nThinking] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { setArtifact } = useArtifact();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (initialAssociatedDocument) {
      console.log(
        'Setting initial artifact from server prop:',
        initialAssociatedDocument.id,
      );
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
      console.log(
        'No initial artifact associated with this chat, ensuring artifact is hidden.',
      );
      setArtifact({ ...initialArtifactData, isVisible: false });
    }
  }, [initialAssociatedDocument, setArtifact]);

  // Polling logic for N8N messages
  useEffect(() => {
    if (isN8nThinking) {
      console.log('[Chat] Starting N8N message polling');

      const pollForMessages = async () => {
        try {
          const response = await fetch(
            `/api/chat/${id}/messages?since=${Date.now()}`,
          );
          if (response.ok) {
            const newMessages = await response.json();

            if (newMessages.length > 0) {
              console.log(
                '[Chat] New messages received from polling:',
                newMessages.length,
              );

              // Add new messages to chat state
              setMessages((currentMessages) => [
                ...currentMessages,
                ...newMessages,
              ]);

              // Stop thinking animation
              setIsN8nThinking(false);

              // Clear polling interval
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
              }
            }
          }
        } catch (error) {
          console.error('[Chat] Error polling for messages:', error);
        }
      };

      // Start polling every 3 seconds
      pollIntervalRef.current = setInterval(pollForMessages, 3000);

      // Initial poll
      pollForMessages();
    }

    // Cleanup function
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [isN8nThinking, id, setMessages]);

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
          status={status}
          votes={votes}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          isArtifactVisible={isArtifactVisible}
          isN8nThinking={isN8nThinking}
        />

        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          {!isReadonly && (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              handleSubmit={customHandleSubmit}
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
          handleSubmit={customHandleSubmit}
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
