import type { UIMessage } from 'ai';
import type { Vote } from '@/lib/db/schema';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { Dispatch, SetStateAction } from 'react';

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
  setMode: Dispatch<SetStateAction<'view' | 'edit'>>;
}

export interface ToolInvocationProps {
  toolName: string;
  toolCallId: string;
  state: 'call' | 'result';
  args?: any;
  result?: any;
  isReadonly: boolean;
}
