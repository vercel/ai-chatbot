"use client";

import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";

type MessageReasoningProps = {
  isLoading: boolean;
  reasoning: string;
};

export function MessageReasoning({
  isLoading,
  reasoning,
}: MessageReasoningProps) {
  // Show reasoning component immediately when streaming starts, even with empty content
  // This ensures the "Thinking..." state appears right away
  const shouldShow = isLoading || reasoning.trim().length > 0;

  if (!shouldShow) {
    return null;
  }

  return (
    <Reasoning
      data-testid="message-reasoning"
      defaultOpen={true}
      isStreaming={isLoading}
    >
      <ReasoningTrigger />
      <ReasoningContent>{reasoning || ""}</ReasoningContent>
    </Reasoning>
  );
}
