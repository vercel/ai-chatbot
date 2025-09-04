'use client';

import type { ReactNode } from 'react';
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from './elements/reasoning';

interface MessageReasoningProps {
  isLoading: boolean;
  reasoning: string;
  children?: React.ReactNode;
}

export function MessageReasoning({
  isLoading,
  reasoning,
  children,
}: MessageReasoningProps) {
  return (
    <Reasoning
      isStreaming={isLoading}
      defaultOpen={true}
      data-testid="message-reasoning"
    >
      <ReasoningTrigger />
      <ReasoningContent>{reasoning}</ReasoningContent>
      {children}
    </Reasoning>
  );
}
