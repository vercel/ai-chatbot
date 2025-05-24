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
        console.log(
          '[Chat DEBUG] Error during n8n processing, setting isN8nProcessing to false.',
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

  const handleSubmitIntercept: typeof originalUseChatHandleSubmit = (
    eventOrOptions,
    optionsBundle,
  ) => {
    console.log('[handleSubmitIntercept DEBUG] Called. Input:', input);
    console.log(
      '[handleSubmitIntercept DEBUG] eventOrOptions:',
      eventOrOptions,
    );
    console.log(
      '[handleSubmitIntercept DEBUG] typeof eventOrOptions:',
      typeof eventOrOptions,
    );
    if (eventOrOptions && typeof eventOrOptions === 'object') {
      console.log(
        '[handleSubmitIntercept DEBUG] eventOrOptions keys:',
        Object.keys(eventOrOptions),
      );
      if ('preventDefault' in eventOrOptions) {
        console.log(
          '[handleSubmitIntercept DEBUG] eventOrOptions has preventDefault property.',
        );
      } else {
        console.log(
          '[handleSubmitIntercept DEBUG] eventOrOptions does NOT have preventDefault property.',
        );
      }
      if ((eventOrOptions as any).messages) {
        console.log(
          '[handleSubmitIntercept DEBUG] eventOrOptions has messages property:',
          (eventOrOptions as any).messages,
        );
      }
    }
    console.log('[handleSubmitIntercept DEBUG] optionsBundle:', optionsBundle);

    const n8nSelectedNow = selectedChatModel === 'n8n-assistant';
    let isNewUserSubmitIntent = false;
    console.log(
      '[handleSubmitIntercept DEBUG] Initial isNewUserSubmitIntent:',
      isNewUserSubmitIntent,
      'n8nSelectedNow:',
      n8nSelectedNow,
    );

    // Case 1: Form submission event (eventOrOptions is a form event)
    if (
      eventOrOptions &&
      typeof (eventOrOptions as React.FormEvent<HTMLFormElement>)
        .preventDefault === 'function'
    ) {
      console.log(
        '[handleSubmitIntercept DEBUG] Entered Case 1 (Form submission event).',
      );
      if (input.trim() !== '') {
        // Check if there's actual input to send
        console.log(
          '[handleSubmitIntercept DEBUG] Case 1: input is not empty. Setting isNewUserSubmitIntent = true.',
        );
        isNewUserSubmitIntent = true;
      } else {
        console.log('[handleSubmitIntercept DEBUG] Case 1: input is empty.');
      }
    }
    // Case 2: Not a form event, BUT there is input. This covers calls like:
    // handleSubmit() when input is present
    // handleSubmit(undefined, options) when input is present
    // handleSubmit(optionsAsFirstArg) when input is present (though optionsAsFirstArg might also contain messages)
    else if (input.trim() !== '') {
      console.log(
        '[handleSubmitIntercept DEBUG] Entered Case 2 (Not a form event, but input is present).',
      );
      // Further check: if eventOrOptions IS an options object with messages, ensure it's a user message for intent.
      // This handles programmatic submissions like resubmitting a specific user message.
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
          console.log(
            '[handleSubmitIntercept DEBUG] Case 2a: Options obj passed as first arg with user message. Setting isNewUserSubmitIntent = true.',
          );
          isNewUserSubmitIntent = true;
        } else {
          console.log(
            '[handleSubmitIntercept DEBUG] Case 2b: Options obj passed as first arg but last message not from user or no messages. Relying on non-empty input.',
          );
          isNewUserSubmitIntent = true; // Fallback to input driving the intent
        }
      } else {
        // If eventOrOptions is not an options object with messages (e.g., it's undefined, or some other options not containing messages directly as first arg),
        // then the non-empty input is the primary driver for user submit intent.
        console.log(
          '[handleSubmitIntercept DEBUG] Case 2c: Input is present, eventOrOptions is not an options obj with messages. Setting isNewUserSubmitIntent = true based on input.',
        );
        isNewUserSubmitIntent = true;
      }
    } else {
      console.log(
        '[handleSubmitIntercept DEBUG] No case matched for setting isNewUserSubmitIntent (input is empty and not a form event with input).',
      );
    }

    console.log(
      '[handleSubmitIntercept DEBUG] Final isNewUserSubmitIntent before n8n check:',
      isNewUserSubmitIntent,
    );

    if (n8nSelectedNow && isNewUserSubmitIntent) {
      if (!isN8nProcessing) {
        console.log(
          '[Chat DEBUG] n8n model selected for new user submit, setting isN8nProcessing to true.',
        );
        setIsN8nProcessing(true);
      } else {
        console.log(
          '[Chat DEBUG] n8n model selected, but already processing. Not changing isN8nProcessing.',
        );
      }
    } else if (n8nSelectedNow && !isNewUserSubmitIntent) {
      console.log(
        '[Chat DEBUG] N8N model selected, but isNewUserSubmitIntent is false. Not setting isN8nProcessing.',
      );
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

  console.log('[Chat DEBUG] selectedChatModel:', selectedChatModel);
  console.log('[Chat DEBUG] status:', status);
  console.log('[Chat DEBUG] displayStatus:', displayStatus);
  console.log('[Chat DEBUG] messages length:', messages.length);
  console.log('[Chat DEBUG] last message:', messages[messages.length - 1]);
  console.log(
    '[Chat DEBUG] last message role:',
    messages[messages.length - 1]?.role,
  );

  const { data: freshMessages } = useSWR(
    isN8nProcessing ? `/api/messages-test?chatId=${id}` : null,
    fetcher,
    { refreshInterval: 3000 },
  );

  console.log('[Chat DEBUG] SWR polling active:', !!isN8nProcessing);
  console.log('[Chat DEBUG] freshMessages:', freshMessages);

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
          console.log(
            '[Chat DEBUG] Appending new assistant message from poll:',
            uiMsg,
          );
          append(uiMsg);
          appendedNewMessages = true;
        }
      });

      if (appendedNewMessages) {
        console.log(
          '[Chat DEBUG] n8n message appended, setting isN8nProcessing to false.',
        );
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

  console.log(
    '[CRITICAL DEBUG] Final computed displayStatus for Messages component:',
    displayStatus,
  );
  console.log('[CRITICAL DEBUG] useChat status:', status);
  console.log('[CRITICAL DEBUG] isN8nProcessing:', isN8nProcessing);

  if (isN8nProcessing && !freshMessages) {
    const swrKey = `/api/messages-test?chatId=${id}`;
    console.log(
      '[Chat DEBUG] Mutating SWR cache for key (on isN8nProcessing start):',
      swrKey,
    );
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
