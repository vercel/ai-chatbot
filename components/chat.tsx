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
      console.log(
        '[Chat] onFinish called. selectedChatModel:',
        selectedChatModel,
      );
      console.log('[Chat] onFinish status:', status);
      //   revalidate: false,
      // });

      // COMMENT OUT THIS LINE
      // mutate(unstable_serialize(getChatHistoryPaginationKey)); // Needs to be adapted if history structure changes
    },
    onError: (error) => {
      // Add detailed error logging
      console.error(
        '[Chat] onError called. selectedChatModel:',
        selectedChatModel,
      );
      console.error('[Chat] onError details:', error);
      console.error('[Chat] onError status:', status);
      toast.error('An error occurred, please try again!');
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

  // Detect if waiting for n8n response (minimal inline check)
  const n8nSelected = selectedChatModel === 'n8n-assistant';
  const lastMsgUser = messages[messages.length - 1]?.role === 'user';
  const statusIsSubmitted = status === 'submitted';
  console.log(
    '[isN8nWaiting CALC] n8nSelected:',
    n8nSelected,
    'lastMsgUser:',
    lastMsgUser,
    'statusIsSubmitted:',
    statusIsSubmitted,
    'raw_status:',
    status,
  );
  const isN8nWaiting = n8nSelected && lastMsgUser && statusIsSubmitted;

  // Override status to keep thinking animation for n8n
  const displayStatus = isN8nWaiting ? 'submitted' : status;

  // DEBUG LOGGING - Understanding current behavior
  console.log('[Chat DEBUG] selectedChatModel:', selectedChatModel);
  console.log('[Chat DEBUG] status:', status);
  console.log('[Chat DEBUG] displayStatus:', displayStatus);
  console.log('[Chat DEBUG] messages length:', messages.length);
  console.log('[Chat DEBUG] last message:', messages[messages.length - 1]);
  console.log(
    '[Chat DEBUG] last message role:',
    messages[messages.length - 1]?.role,
  );
  console.log('[Chat DEBUG] isN8nWaiting:', isN8nWaiting);

  // Add SWR polling for messages when waiting for n8n
  const { data: freshMessages } = useSWR(
    isN8nWaiting ? `/api/messages?chatId=${id}` : null,
    fetcher,
    { refreshInterval: 3000 },
  );

  console.log('[Chat DEBUG] SWR polling active:', !!isN8nWaiting);
  console.log('[Chat DEBUG] freshMessages:', freshMessages);

  // Sync fresh messages when polling detects new data
  useEffect(() => {
    if (freshMessages && freshMessages.length > messages.length) {
      // Convert DB messages to UI format and update state
      const uiMessages = freshMessages.map((dbMessage: any) => {
        // Parse parts and attachments from JSON strings to objects
        const parsedParts =
          typeof dbMessage.parts === 'string'
            ? JSON.parse(dbMessage.parts)
            : dbMessage.parts || [];
        const parsedAttachments =
          typeof dbMessage.attachments === 'string'
            ? JSON.parse(dbMessage.attachments)
            : dbMessage.attachments || [];

        // Extract text content from the PARSED parts
        const textContent = parsedParts
          ?.map((part: any) => {
            if (part.type === 'text') return part.text;
            // According to Vercel AI SDK, reasoning is a top-level field, not in parts.
            // However, if your n8n workflow puts it in parts, this is fine.
            if (part.type === 'reasoning') return part.reasoning;
            return '';
          })
          .filter(Boolean)
          .join('');

        return {
          id: dbMessage.id,
          role: dbMessage.role,
          content: textContent || '', // Ensure content is a string
          parts: parsedParts, // Use the parsed parts
          experimental_attachments: parsedAttachments, // Use the parsed attachments
          createdAt: dbMessage.createdAt,
        };
      });
      setMessages(uiMessages);
    }
  }, [freshMessages, messages.length, setMessages]);

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
  console.log('[CRITICAL DEBUG] isN8nWaiting:', isN8nWaiting);

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
              handleSubmit={handleSubmit}
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
          handleSubmit={handleSubmit}
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
