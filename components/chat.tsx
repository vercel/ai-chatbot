'use client';

import type { Attachment, Message } from 'ai';
import { useChat } from 'ai/react';
import { useState, useCallback, memo, useEffect } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { useLocalStorage } from 'usehooks-ts';

import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher, generateUUID, cn } from '@/lib/utils';

import { Artifact } from './artifact';
import { ReferencesSidebar } from './references-sidebar';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import { VisibilityType } from './visibility-selector';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { useReferencesSidebarSelector } from '@/hooks/use-references-sidebar';
import { toast } from 'sonner';

// Using memo to prevent unnecessary re-renders
export const Chat = memo(function Chat({
  id,
  initialMessages,
  selectedChatModel,
  selectedVisibilityType,
  isReadonly,
}: {
  id: string;
  initialMessages: Array<Message>;
  selectedChatModel: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const { mutate } = useSWRConfig();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Track selected knowledge IDs for filtering search results
  const [selectedKnowledgeIds, setSelectedKnowledgeIds] = useLocalStorage<string[]>(
    `chat-${id}-knowledge-selection`,
    [] // Empty array means all knowledge is selected (default)
  );

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    isLoading,
    stop,
    reload,
  } = useChat({
    id,
    body: { 
      id, 
      selectedChatModel: selectedChatModel,
      selectedKnowledgeIds: selectedKnowledgeIds.length > 0 ? selectedKnowledgeIds : undefined
    },
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    onFinish: () => {
      setErrorMessage(null);
      mutate('/api/history');
    },
    onResponse: (response) => {
      if (!response.ok) {
        console.error('Error response from chat API:', response.status, response.statusText);
        response.json().then(data => {
          console.error('Error details:', data);
          if (data.message) {
            setErrorMessage(data.message);
          }
        }).catch(e => {
          console.error('Could not parse error response:', e);
        });
      }
    },
    onError: (error) => {
      console.error('Chat error:', error);
      let errorMsg = 'An error occurred, please try again!';
      
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        errorMsg = `Error: ${error.message || 'Unknown error'}`;
      }
      
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    },
  });

  const { data: votes } = useSWR<Array<Vote>>(
    `/api/vote?chatId=${id}`,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);
  const isReferencesSidebarVisible = useReferencesSidebarSelector((state) => state.isVisible);

  // Memoize expensive callbacks
  const handleSubmitMemoized = useCallback(
    (e: React.FormEvent<HTMLFormElement> | { preventDefault?: () => void }) => {
      handleSubmit(e);
    },
    [handleSubmit]
  );

  return (
    <>
      <div className={cn(
        "flex flex-col min-w-0 h-dvh bg-background",
        isReferencesSidebarVisible && "pr-80" // Add padding when reference sidebar is visible
      )}>
        <ChatHeader
          chatId={id}
          selectedModelId={selectedChatModel}
          selectedVisibilityType={selectedVisibilityType}
          isReadonly={isReadonly}
        />

        {errorMessage && (
          <div className="bg-destructive/10 text-destructive text-sm p-2 mx-auto w-full max-w-3xl my-2 rounded">
            <p>Error: {errorMessage}</p>
            <p className="text-xs mt-1">Check the browser console for more details.</p>
          </div>
        )}

        <Messages
          chatId={id}
          isLoading={isLoading}
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
              handleSubmit={handleSubmitMemoized}
              isLoading={isLoading}
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

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
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
      
      {/* Reference Sidebar - No specific messageId here as it will be set when references are loaded */}
      <ReferencesSidebar chatId={id} />
    </>
  );
});
