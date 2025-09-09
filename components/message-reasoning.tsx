'use client';

import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from './elements/reasoning';
import { extractReasoningTitleAndBody } from '@/lib/utils';

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
  const { title, body } = extractReasoningTitleAndBody(reasoning);
  return (
    <Reasoning
      isStreaming={isLoading}
      defaultOpen={true}
      data-testid="message-reasoning"
    >
      <ReasoningTrigger title={title} />
      <ReasoningContent>{body || reasoning}</ReasoningContent>
      {children}
    </Reasoning>
  );
}
