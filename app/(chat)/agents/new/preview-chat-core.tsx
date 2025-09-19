'use client';

import { useChat } from '@ai-sdk/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DefaultChatTransport } from 'ai';
import { generateUUID, fetchWithErrorHandlers } from '@/lib/utils';
import { Messages } from '@/components/messages';
import { MultimodalInput } from '@/components/multimodal-input';
import type { Attachment, ChatMessage } from '@/lib/types';
import {
  DEFAULT_ACTIVE_TOOL_IDS,
  sortActiveTools,
} from '@/lib/ai/tools/active-tools';

interface PreviewChatCoreProps {
  formData: {
    name: string;
    description: string;
    agentPrompt: string;
    isPublic: boolean;
    vectorStoreId?: string;
  };
  user: any;
}

export function PreviewChatCore({ formData, user }: PreviewChatCoreProps) {
  const [previewChatId] = useState(() => generateUUID());
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const [reasoningEffort, setReasoningEffort] = useState<
    'low' | 'medium' | 'high'
  >('medium');
  const [activeTools, setActiveTools] = useState<Array<string>>(() => [
    ...DEFAULT_ACTIVE_TOOL_IDS,
  ]);

  const updateActiveTools = useCallback(
    (next: Array<string> | ((current: Array<string>) => Array<string>)) => {
      setActiveTools((current) => {
        const base = sortActiveTools(current);
        const updated =
          typeof next === 'function'
            ? (next as (value: Array<string>) => Array<string>)(base)
            : next;
        return sortActiveTools(updated);
      });
    },
    [],
  );

  // Keep latest values in refs to avoid stale closure in transport
  const formDataRef = useRef(formData);
  const reasoningRef = useRef(reasoningEffort);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);
  useEffect(() => {
    reasoningRef.current = reasoningEffort;
  }, [reasoningEffort]);

  const { messages, setMessages, sendMessage, status, stop, regenerate } =
    useChat<ChatMessage>({
      id: previewChatId,
      experimental_throttle: 100,
      generateId: generateUUID,
      transport: new DefaultChatTransport({
        api: '/api/chat',
        fetch: fetchWithErrorHandlers,
        prepareSendMessagesRequest({ messages, id, body }) {
          // Keep latest values via refs to avoid stale closures
          // Build the agent context from the most recent form values
          const fd = formDataRef.current;
          const hasAnyAgentInput = Boolean(
            (fd.name && fd.name.trim().length > 0) ||
              (fd.agentPrompt && fd.agentPrompt.trim().length > 0) ||
              (fd.description && fd.description.trim().length > 0),
          );

          const agentCtx = hasAnyAgentInput
            ? {
                agentName: fd.name?.trim() || 'Preview Agent',
                agentDescription: fd.description?.trim() || 'Agent preview',
                agentPrompt: fd.agentPrompt?.trim() || undefined,
              }
            : undefined;

          const currentReasoning = reasoningRef.current;

          if (typeof window !== 'undefined') {
            // Lightweight debug aid in preview mode
            console.debug('PreviewChatCore: sending with agentContext', {
              hasName: !!agentCtx?.agentName,
              hasPrompt: !!agentCtx?.agentPrompt,
              reasoning: currentReasoning,
            });
          }

          return {
            body: {
              // Spread the transport-provided body first, then override with latest values
              ...(body ?? {}),
              id,
              message: messages.at(-1),
              reasoningEffort: currentReasoning,
              selectedVisibilityType: 'private',
              ...(agentCtx ? { agentContext: agentCtx } : {}),
              ...(fd.vectorStoreId
                ? { agentVectorStoreId: fd.vectorStoreId }
                : {}),
            },
          };
        },
      }),
      onFinish: () => {},
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

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <Messages
          chatId={previewChatId}
          status={status}
          votes={undefined}
          messages={messages}
          setMessages={setMessages}
          regenerate={regenerate}
          isReadonly={false}
          isArtifactVisible={false}
          reasoningEffort={reasoningEffort}
        />
      </div>

      <div className="mb-2">
        <MultimodalInput
          chatId={previewChatId}
          input={input}
          setInput={setInput}
          status={status}
          stop={stop}
          attachments={attachments}
          setAttachments={setAttachments}
          messages={messages}
          setMessages={setMessages}
          sendMessage={sendMessageWithActiveTools}
          selectedVisibilityType="private"
          reasoningEffort={reasoningEffort}
          setReasoningEffort={setReasoningEffort}
          usage={undefined}
          hideSuggestions={true}
          disableHistoryUpdate={true}
          activeTools={activeTools}
          setActiveTools={updateActiveTools}
        />
      </div>
    </div>
  );
}
