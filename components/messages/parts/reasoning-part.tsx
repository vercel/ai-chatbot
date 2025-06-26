'use client';

import { MessageReasoning } from '../../message-reasoning';

interface ReasoningPartProps {
  partKey: string;
  reasoning: string;
  isLoading: boolean;
}

export function ReasoningPart({ partKey, reasoning, isLoading }: ReasoningPartProps) {
  return (
    <MessageReasoning
      key={partKey}
      isLoading={isLoading}
      reasoning={reasoning}
    />
  );
}