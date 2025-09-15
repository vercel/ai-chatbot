'use client';

import {
  DefaultChatTransport,
  type DataUIPart,
  type LanguageModelUsage,
} from 'ai';
import { useChat } from '@ai-sdk/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { ChatHeader } from '@/components/chat-header';
import { AgentChatHeader } from '@/components/agent-chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher, fetchWithErrorHandlers, generateUUID } from '@/lib/utils';
import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import type { VisibilityType } from './visibility-selector';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { unstable_serialize } from 'swr/infinite';
import { getChatHistoryPaginationKey } from './sidebar-history';
import { toast } from './toast';
import { useSearchParams } from 'next/navigation';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { useAutoResume } from '@/hooks/use-auto-resume';
import { ChatSDKError } from '@/lib/errors';
import type { Attachment, ChatMessage, CustomUIDataTypes } from '@/lib/types';
import { useDataStream } from './data-stream-provider';
import { useLocalStorage } from 'usehooks-ts';
import {
  DEFAULT_ACTIVE_TOOL_IDS,
  sortActiveTools,
} from '@/lib/ai/tools/active-tools';

export function Chat({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  user,
  autoResume,
  initialLastContext,
  initialAgentContext,
}: {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  user: any;
  autoResume: boolean;
  initialLastContext?: LanguageModelUsage;
  initialAgentContext?: {
    agentName: string;
    agentDescription?: string;
    agentPrompt?: string;
  } | null;
}) {
  const params = useSearchParams();
  const agentSlug = params.get('agent');

  const { visibilityType } = useChatVisibility({
    chatId: id,
    initialVisibilityType,
  });

  const { mutate } = useSWRConfig();
  const { setDataStream } = useDataStream();

  const [input, setInput] = useState<string>('');
  const [usage, setUsage] = useState<LanguageModelUsage | undefined>(
    initialLastContext,
  );
  const [reasoningEffort, setReasoningEffort] = useState<
    'low' | 'medium' | 'high'
  >('medium');
  const [agentContext, setAgentContext] = useState<{
    agentName: string;
    agentDescription?: string;
    agentPrompt?: string;
  } | null>(initialAgentContext || null);

  const [storedActiveTools, setStoredActiveTools] = useLocalStorage<
    Array<string>
  >('active-tools', DEFAULT_ACTIVE_TOOL_IDS);

  const activeTools = useMemo(
    () => sortActiveTools(Array.isArray(storedActiveTools) ? storedActiveTools : []),
    [storedActiveTools],
  );

  const setActiveTools = useCallback(
    (next: Array<string> | ((current: Array<string>) => Array<string>)) => {
      setStoredActiveTools((current) => {
        const base = Array.isArray(current)
          ? sortActiveTools(current)
          : [...DEFAULT_ACTIVE_TOOL_IDS];
        const updated =
          typeof next === 'function'
            ? (next as (value: Array<string>) => Array<string>)(base)
            : next;
        return sortActiveTools(updated);
      });
    },
    [setStoredActiveTools],
  );

  useEffect(() => {
    if (!Array.isArray(storedActiveTools)) {
      setStoredActiveTools([...DEFAULT_ACTIVE_TOOL_IDS]);
      return;
    }

    const normalized = sortActiveTools(storedActiveTools);
    const isSameLength = normalized.length === storedActiveTools.length;
    const hasSameOrder = normalized.every(
      (id, index) => storedActiveTools[index] === id,
    );

    if (!isSameLength || !hasSameOrder) {
      setStoredActiveTools(normalized);
    }
  }, [storedActiveTools, setStoredActiveTools]);

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    resumeStream,
  } = useChat<ChatMessage>({
    id,
    messages: initialMessages,
    experimental_throttle: 100,
    generateId: generateUUID,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      fetch: fetchWithErrorHandlers,
      prepareSendMessagesRequest({ messages, id, body }) {
        return {
          body: {
            id,
            message: messages.at(-1),
            reasoningEffort: reasoningEffort,
            selectedVisibilityType: visibilityType,
            ...(agentSlug && { agentSlug }),
            ...body,
          },
        };
      },
    }),
    onData: (dataPart) => {
      setDataStream((ds) =>
        ds ? [...ds, dataPart as DataUIPart<CustomUIDataTypes>] : [],
      );
      if ((dataPart as any).type === 'data-usage') {
        setUsage((dataPart as any).data);
      }
    },
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    onError: (error) => {
      if (error instanceof ChatSDKError) {
        toast({
          type: 'error',
          description: error.message,
        });
      }
    },
  });

  const sendMessageWithActiveTools = useCallback(
    (
      message?: Parameters<typeof sendMessage>[0],
      options?: Parameters<typeof sendMessage>[1],
    ) => {
      const mergedBody = { ...(options?.body ?? {}), activeTools };
      return sendMessage(message, { ...options, body: mergedBody });
    },
    [sendMessage, activeTools],
  );

  const searchParams = useSearchParams();
  const query = searchParams.get('query');

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      sendMessageWithActiveTools({
        role: 'user' as const,
        parts: [{ type: 'text', text: query }],
      });

      setHasAppendedQuery(true);
      window.history.replaceState({}, '', `/chat/${id}`);
    }
  }, [query, sendMessageWithActiveTools, hasAppendedQuery, id]);

  // Fetch agent context if this is an agent chat
  useEffect(() => {
    const fetchAgentContext = async () => {
      try {
        const response = await fetch(`/api/chat/${id}/agent`);
        if (response.ok) {
          const data = await response.json();
          if (data) {
            setAgentContext(data);
          }
        }
      } catch (error) {
        console.warn('Failed to fetch agent context:', error);
      }
    };

    fetchAgentContext();
  }, [id]);

  const { data: votes } = useSWR<Array<Vote>>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  useAutoResume({
    autoResume,
    initialMessages,
    resumeStream,
    setMessages,
  });

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background touch-auto overscroll-behavior-contain max-w-[100svw] overflow-x-hidden">
        <ChatHeader
          chatId={id}
          selectedVisibilityType={initialVisibilityType}
          isReadonly={isReadonly}
          session={user}
        />

        {agentContext && <AgentChatHeader agentContext={agentContext} />}

        <Messages
          chatId={id}
          status={status}
          votes={votes}
          messages={messages}
          setMessages={setMessages}
          regenerate={regenerate}
          isReadonly={isReadonly}
          isArtifactVisible={isArtifactVisible}
          reasoningEffort={reasoningEffort}
        />

        <div className="sticky bottom-0 flex gap-2 px-2 md:px-4 pb-3 md:pb-4 mx-auto w-full min-w-0 bg-background max-w-4xl z-[1] border-t-0">
          {!isReadonly && (
            <MultimodalInput
              className="min-w-0 w-full"
              chatId={id}
              input={input}
              setInput={setInput}
              status={status}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setMessages}
              sendMessage={sendMessageWithActiveTools}
              selectedVisibilityType={visibilityType}
              reasoningEffort={reasoningEffort}
              setReasoningEffort={setReasoningEffort}
              usage={usage}
              activeTools={activeTools}
              setActiveTools={setActiveTools}
            />
          )}
        </div>
      </div>

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        status={status}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        sendMessage={sendMessageWithActiveTools}
        messages={messages}
        setMessages={setMessages}
        regenerate={regenerate}
        votes={votes}
        isReadonly={isReadonly}
        selectedVisibilityType={visibilityType}
        reasoningEffort={reasoningEffort}
        activeTools={activeTools}
        setActiveTools={setActiveTools}
      />
    </>
  );
}
