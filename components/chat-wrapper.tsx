"use client";

import { useState } from "react";
import { isWebLLMModel } from "@/lib/ai/models";
import type { ChatMessage } from "@/lib/types";
import type { AppUsage } from "@/lib/usage";
import { Chat } from "./chat";
import type { VisibilityType } from "./visibility-selector";
import { WebLLMChat } from "./webllm-chat";

export function ChatWrapper({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  autoResume,
  initialLastContext,
}: {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  autoResume: boolean;
  initialLastContext?: AppUsage;
}) {
  const [currentModelId, setCurrentModelId] = useState(initialChatModel);
  const [messagesForSwitch] = useState<ChatMessage[]>(initialMessages);

  const isWebLLM = isWebLLMModel(currentModelId);

  const handleModelChange = (modelId: string) => {
    setCurrentModelId(modelId);
  };

  if (isWebLLM) {
    return (
      <WebLLMChat
        id={id}
        initialChatModel={currentModelId}
        initialMessages={messagesForSwitch}
        initialVisibilityType={initialVisibilityType}
        isReadonly={isReadonly}
        onModelChange={handleModelChange}
      />
    );
  }

  return (
    <Chat
      autoResume={autoResume}
      id={id}
      initialChatModel={currentModelId}
      initialLastContext={initialLastContext}
      initialMessages={messagesForSwitch}
      initialVisibilityType={initialVisibilityType}
      isReadonly={isReadonly}
      onModelChange={handleModelChange}
    />
  );
}
