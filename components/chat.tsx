// UNIQUE_STRING_FOR_DEBUGGING_VERCEL_DEPLOYMENT_MAY_24_2024_V1
'use client';
console.log('CHAT_COMPONENT_EXECUTION_MARKER_V2_MAY_24'); // New marker

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
  const [hasMounted, setHasMounted] = useState(false);

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
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    experimental_prepareRequestBody: (body) => {
      console.log(
        '[CLIENT_PREPARE_BODY_DEBUG] Input to experimental_prepareRequestBody:',
        JSON.parse(JSON.stringify(body)), // Log the whole body options
      );

      // Assuming body.messages is an array and we need the last one
      const latestMessage =
        body.messages && body.messages.length > 0
          ? body.messages[body.messages.length - 1]
          : null;

      console.log(
        '[CLIENT_PREPARE_BODY_DEBUG] Latest message from body.messages:',
        latestMessage
          ? JSON.parse(JSON.stringify(latestMessage))
          : 'No messages in body',
      );

      const payload = {
        id: id, // chatId
        message: latestMessage, // This is the single message object
        selectedChatModel: selectedChatModel,
        selectedVisibilityType: selectedVisibilityType,
        // documentId is NOT sent in this phase
      };

      console.log(
        '[CLIENT_PREPARE_BODY_DEBUG] Output payload from experimental_prepareRequestBody:',
        JSON.parse(JSON.stringify(payload)),
      );
      return payload;
    },
    onFinish: (message) => {
      // Added message parameter to log
      console.log(
        '[CHAT_ONFINISH_DEBUG] onFinish called. selectedChatModel:',
        selectedChatModel,
        ', Message:',
        message ? JSON.stringify(message) : 'N/A', // Log the message if available
      );
      console.log('[CHAT_ONFINISH_DEBUG] Status:', status);
      if (selectedChatModel === 'n8n-assistant' && isN8nProcessing) {
        // Check if it was N8N that finished
        console.log(
          '[N8N_STATE_DEBUG] N8N model finished, setting isN8nProcessing to false.',
        );
        setIsN8nProcessing(false);
      }
      // mutate(unstable_serialize(getChatHistoryPaginationKey)); // Example, adapt if needed
    },
    onError: (error) => {
      console.error(
        '[CHAT_ONERROR_DEBUG] onError called. selectedChatModel:',
        selectedChatModel,
      );
      console.error('[CHAT_ONERROR_DEBUG] Error details:', error);
      console.error('[CHAT_ONERROR_DEBUG] Status:', status);
      toast.error('An error occurred, please try again!');
      if (selectedChatModel === 'n8n-assistant' && isN8nProcessing) {
        console.log(
          '[N8N_STATE_DEBUG] Error during N8N processing, setting isN8nProcessing to false.',
        );
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

  const handleFormSubmit: typeof handleSubmit = (
    eventOrOptions,
    optionsBundle,
  ) => {
    // Log the input value from eventOrOptions if it's an event, or directly if it's options
    let currentInputValue = '';
    if (typeof eventOrOptions === 'string') {
      // if it's just text input
      currentInputValue = eventOrOptions;
    } else if (
      eventOrOptions &&
      typeof (eventOrOptions as any).target === 'object'
    ) {
      // if it's a form event
      // This is a simplified way; actual input might be nested differently or in optionsBundle
      // For robust input logging, you might need to inspect how `handleSubmit` internally gets the input value.
      currentInputValue = (
        eventOrOptions as React.FormEvent<HTMLFormElement>
      ).currentTarget.elements.namedItem('content')
        ? (
            (
              eventOrOptions as React.FormEvent<HTMLFormElement>
            ).currentTarget.elements.namedItem('content') as HTMLInputElement
          ).value
        : input; // Fallback to hook's input state
    } else {
      currentInputValue = input; // Fallback to hook's input state if not easily derived
    }

    console.log('[CHAT_HANDLE_SUBMIT_DEBUG] handleFormSubmit called with:', {
      selectedChatModel,
      inputValue: currentInputValue, // Log derived/current input
      isN8nProcessing,
    });

    const isN8nModel = selectedChatModel === 'n8n-assistant';
    const hasInput = currentInputValue.trim() !== '';

    console.log(
      '[N8N_STATE_DEBUG] In handleFormSubmit - isN8nModel:',
      isN8nModel,
      ', hasInput:',
      hasInput,
      ', current isN8nProcessing state:',
      isN8nProcessing,
    );

    if (isN8nModel && hasInput && !isN8nProcessing) {
      console.log(
        '[N8N_STATE_DEBUG] Setting isN8nProcessing to true for this N8N message.',
      );
      setIsN8nProcessing(true);
    }

    return handleSubmit(eventOrOptions, optionsBundle);
  };

  const displayStatus = isN8nProcessing ? 'submitted' : status;

  const { data: freshMessages, error: swrError } = useSWR(
    isN8nProcessing ? `/api/messages?chatId=${id}` : null,
    (url: string) => {
      console.log('[SWR_POLL_DEBUG] Fetcher called for URL:', url);
      return fetcher(url);
    },
    {
      refreshInterval: 3000,
      onError: (err, key) => {
        console.error(
          '[SWR_POLL_DEBUG] SWR Error for key:',
          key,
          'Error:',
          err,
        );
      },
    },
  );

  if (swrError) {
    // Log if SWR itself had an error not caught by its onError
    console.error('[SWR_POLL_DEBUG] SWR hook encountered an error:', swrError);
  }

  useEffect(() => {
    if (freshMessages && freshMessages.length > 0) {
      console.log(
        '[SWR_POLL_DEBUG] SWR returned freshMessages. Count:',
        freshMessages.length,
        'Data:',
        JSON.stringify(freshMessages.slice(-3)),
      );
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
        .filter((msg: UIMessage | null): msg is UIMessage => msg !== null);

      if (hasMounted) {
        console.log(
          '[N8N_SWR_DEBUG] Hydration guard: hasMounted=true. Proceeding with message processing.',
        );
        let appendedNewMessages = false;
        newUIMessages.forEach((uiMsg: UIMessage) => {
          if (uiMsg.role === 'assistant' && !currentMessageIds.has(uiMsg.id)) {
            console.log(
              '[SWR_POLL_DEBUG] Adding new assistant message from SWR poll to local state:',
              JSON.stringify(uiMsg),
            );
            setMessages((prevMessages) => [...prevMessages, uiMsg]);
            currentMessageIds.add(uiMsg.id);
            appendedNewMessages = true;
          }
        });

        if (appendedNewMessages) {
          console.log(
            '[N8N_STATE_DEBUG] New assistant messages appended from SWR, setting isN8nProcessing to false.',
          );
          setIsN8nProcessing(false);
        }
      } else {
        console.log(
          '[N8N_SWR_DEBUG] Hydration guard: hasMounted=false. SKIPPING message processing from SWR during initial render.',
        );
      }
    } else if (freshMessages) {
      // Log if freshMessages is defined but empty (e.g., empty array)
      console.log(
        '[SWR_POLL_DEBUG] SWR returned freshMessages, but it is empty or has no new messages to append.',
        JSON.stringify(freshMessages),
      );
    }
  }, [
    freshMessages,
    setMessages,
    messages,
    selectedChatModel,
    isN8nProcessing,
    setIsN8nProcessing,
    hasMounted,
  ]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

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
    const swrKey = `/api/messages?chatId=${id}`;
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
              handleSubmit={handleFormSubmit}
              status={displayStatus}
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
          handleSubmit={handleFormSubmit}
          status={displayStatus}
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
