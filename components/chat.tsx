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

  // For n8n flows, track whether we're awaiting the callback
  const [awaitingN8n, setAwaitingN8n] = useState(false);

  // When using an n8n model and user submission is acknowledged, start polling
  useEffect(() => {
    if (selectedChatModel.startsWith('n8n') && status === 'submitted') {
      setAwaitingN8n(true);
    }
  }, [status, selectedChatModel]);

  // Poll the messages endpoint until the assistant callback arrives
  const { data: dbMessages } = useSWR(
    awaitingN8n ? `/api/messages?chatId=${id}` : null,
    fetcher,
    { refreshInterval: 3000 },
  );

  useEffect(() => {
    if (!dbMessages || !awaitingN8n) return;
    // Find new assistant messages in DB not yet in local state
    const existingIds = new Set(messages.map((m) => m.id));
    const newAssistant = (dbMessages as any[]).filter(
      (m) => m.role === 'assistant' && !existingIds.has(m.id),
    );
    if (newAssistant.length > 0) {
      newAssistant.forEach((m) => {
        // Reconstruct UIMessage
        append({
          id: m.id,
          role: 'assistant',
          content: Array.isArray(m.parts)
            ? m.parts.map((p: any) => p.text).join('')
            : '',
          parts: m.parts,
          experimental_attachments: m.attachments,
          createdAt: new Date(m.createdAt),
        });
      });
      setAwaitingN8n(false);
    }
  }, [dbMessages, messages, append, awaitingN8n]);

  const { data: votes } = useSWR<Array<Vote>>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

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
          isAwaitingN8n={awaitingN8n}
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
