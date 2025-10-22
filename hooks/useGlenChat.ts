import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState } from 'react';
import type { DemoFlow } from '@/config/demoScript';
import { runDemoFlow } from '@/lib/runDemoFlow';
import { toast } from '@/components/toast';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export function useGlenChat({
  setAvatarState,
  setAvatarText,
  muted,
  onSummary,
}: {
  setAvatarState: (state: 'idle' | 'listening' | 'thinking' | 'speaking') => void;
  setAvatarText: (text?: string) => void;
  muted: boolean;
  onSummary?: (priorities: string[]) => void;
}) {
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [isScripted, setIsScripted] = useState(false);

  // AI SDK chat hook
  const { sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/glen-chat',
      prepareSendMessagesRequest(request) {
        return {
          body: {
            history: conversationHistory,
            ...request.body,
          },
        };
      },
    }),
    onFinish: (options) => {
      const lastMessage = options.message;
      if (!lastMessage) {
        return;
      }
      
      setAvatarState('speaking');
      
      // Extract text content from message parts
      const textParts = lastMessage.parts?.filter((part: any) => part.type === 'text') || [];
      const messageContent = textParts.map((part: any) => part.text).join('');
      
      setAvatarText(messageContent);
      setConversationHistory((prev) => [
        ...prev,
        { role: 'assistant', content: messageContent },
      ]);

      // Use TTS for response
      if (!muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(messageContent);
        utterance.onend = () => {
          setAvatarState('idle');
          setAvatarText(undefined);
        };
        window.speechSynthesis.speak(utterance);
      } else {
        // Fallback timing
        const duration = Math.max(2000, Math.min(6000, messageContent.length * 50));
        setTimeout(() => {
          setAvatarState('idle');
          setAvatarText(undefined);
        }, duration);
      }
    },
    onError: (error: Error) => {
      console.error('Chat error:', error);
      setAvatarState('idle');
      toast({ type: 'error', description: 'Failed to get response. Please try again.' });
    },
  });

  // Send scripted flow (for known chips)
  const sendScriptedMessage = async (flow: DemoFlow) => {
    setIsScripted(true);
    setConversationHistory((prev) => [
      ...prev,
      { role: 'user', content: flow.userPrompt },
      { role: 'assistant', content: flow.avatarResponse },
    ]);

    await runDemoFlow({
      step: {
        user: flow.userPrompt,
        avatarText: flow.avatarResponse,
        summary: flow.priorities,
      },
      setAvatarState,
      setAvatarText,
      appendMessages: () => {
        // No-op: scripted messages don't need to append to chat history
      },
      onSummary: onSummary || (() => {
        // No-op: no summary callback provided
      }),
      ttsEnabled: !muted,
    });

    setIsScripted(false);
  };

  // Send LLM message (for free-form or unknown chips)
  const sendLLMMessage = async (message: string) => {
    // Safety check for sendMessage function
    if (!sendMessage || typeof sendMessage !== 'function') {
      console.error('Chat hook not initialized properly');
      toast({ type: 'error', description: 'LLM not available - please try scripted responses' });
      setAvatarState('idle');
      return;
    }

    setAvatarState('listening');
    await new Promise((r) => setTimeout(r, 400));
    setAvatarState('thinking');

    setConversationHistory((prev) => [
      ...prev,
      { role: 'user', content: message },
    ]);

    sendMessage({ 
      role: 'user', 
      parts: [{ type: 'text', text: message }] 
    });
  };

  return {
    sendScriptedMessage,
    sendLLMMessage,
    isLoading: status === 'streaming' || isScripted,
    conversationHistory,
  };
}
