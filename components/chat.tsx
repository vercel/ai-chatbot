'use client';

import type { Attachment, UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { ChatHeader } from '@/components/chat-header';
import type { Vote, Document as DBDocument, DBMessage } from '@/lib/db/schema';
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

// Helper to convert DB messages to UI messages if needed by SWR
function convertToUIMessages(dbMessages: DBMessage[]): UIMessage[] {
  return dbMessages.map((message) => {
    return {
      id: message.id,
      role: message.role as UIMessage['role'], // Assuming role is compatible
      content: Array.isArray(message.parts) // Construct content from parts
        ? message.parts.map((p: any) => p.text).join('')
        : '',
      parts: message.parts as any, // Cast parts if structure matches
      experimental_attachments: message.attachments as any, // Cast attachments
      createdAt: new Date(message.createdAt), // Ensure createdAt is a Date
    } satisfies UIMessage;
  });
}

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
  const { mutate: globalMutate } = useSWRConfig();

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
    body: { id, selectedChatModel },
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    onFinish: () => {
      console.log('[Chat] onFinish called for model:', selectedChatModel);
      if (!selectedChatModel.startsWith('n8n')) {
        globalMutate(`/api/messages?chatId=${id}`);
      }
    },
    onError: (error) => {
      console.error('[Chat] onError called:', error);
      toast.error('An error occurred, please try again!');
    },
  });

  const { data: swrDbMessages, mutate: mutateSwrMessages } = useSWR<
    DBMessage[]
  >(`/api/messages?chatId=${id}`, fetcher, {
    refreshInterval: selectedChatModel.startsWith('n8n') ? 3000 : 0,
  });

  const displayMessages = swrDbMessages
    ? convertToUIMessages(swrDbMessages)
    : initialMessages;

  useEffect(() => {
    if (swrDbMessages) {
      const convertedSwrMessages = convertToUIMessages(swrDbMessages);
      if (JSON.stringify(convertedSwrMessages) !== JSON.stringify(messages)) {
        setMessages(convertedSwrMessages);
      }
    }
  }, [swrDbMessages, messages, setMessages]);

  const { data: votes } = useSWR<Array<Vote>>(
    displayMessages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  const { setArtifact } = useArtifact();

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
          messages={displayMessages}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          isArtifactVisible={isArtifactVisible}
          selectedChatModel={selectedChatModel}
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
