'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import { DefaultChatTransport } from 'ai';
import { generateUUID, fetchWithErrorHandlers } from '@/lib/utils';
import { Messages } from '@/components/messages';
import { MultimodalInput } from '@/components/multimodal-input';
import type { Attachment, ChatMessage } from '@/lib/types';

interface PreviewChatCoreProps {
  formData: {
    name: string;
    description: string;
    agentPrompt: string;
    isPublic: boolean;
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
          const agentCtx = formData.name
            ? {
                agentName: formData.name || 'Preview Agent',
                agentDescription: formData.description || 'Agent preview',
                agentPrompt: formData.agentPrompt || undefined,
              }
            : undefined;

          const currentReasoning = reasoningEffort;

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
              id,
              message: messages.at(-1),
              reasoningEffort: currentReasoning,
              selectedVisibilityType: 'private',
              agentContext: agentCtx,
              ...body,
            },
          };
        },
      }),
      onFinish: () => {},
    });

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
          sendMessage={sendMessage}
          selectedVisibilityType="private"
          reasoningEffort={reasoningEffort}
          setReasoningEffort={setReasoningEffort}
          usage={undefined}
          hideSuggestions={true}
        />
      </div>
    </div>
  );
}
