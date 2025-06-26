import type { UIMessage } from 'ai';
import type { Vote } from '@/lib/db/schema';
import type { UseChatHelpers } from '@ai-sdk/react';

export interface BaseMessageProps {
  chatId: string;
  message: UIMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
}

export interface MessageMode {
  mode: 'view' | 'edit';
  setMode: (mode: 'view' | 'edit') => void;
}

export interface ToolInvocationProps {
  toolName: string;
  toolCallId: string;
  state: 'call' | 'result';
  args?: any;
  result?: any;
  isReadonly: boolean;
}
