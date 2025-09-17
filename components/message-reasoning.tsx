'use client';

import { useState, useEffect } from 'react';
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from './elements/reasoning';

interface MessageReasoningProps {
  isLoading: boolean;
  reasoning: string;
}

export function MessageReasoning({
  isLoading,
  reasoning,
}: MessageReasoningProps) {
  const [hasBeenStreaming, setHasBeenStreaming] = useState(isLoading);

  useEffect(() => {
    if (isLoading) {
      setHasBeenStreaming(true);
    }
  }, [isLoading]);
  
  return (
    <Reasoning
      isStreaming={isLoading}
      defaultOpen={hasBeenStreaming}
      data-testid="message-reasoning"
    >
      <ReasoningTrigger />
      <ReasoningContent>{reasoning}</ReasoningContent>
    </Reasoning>
  );
}
