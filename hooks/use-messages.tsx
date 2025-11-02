import type { useChat } from "@ai-sdk/react";
import { useEffect, useState } from "react";
import type { ChatMessage } from "@/lib/types";
import { useScrollToBottom } from "./use-scroll-to-bottom";

type UseChatReturnType = ReturnType<typeof useChat<ChatMessage>>;

export function useMessages({
  status,
}: {
  status: UseChatReturnType["status"];
}) {
  const {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
    onViewportEnter,
    onViewportLeave,
  } = useScrollToBottom();

  const [hasSentMessage, setHasSentMessage] = useState(false);

  useEffect(() => {
    if (status === "submitted") {
      setHasSentMessage(true);
    }
  }, [status]);

  return {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
    onViewportEnter,
    onViewportLeave,
    hasSentMessage,
  };
}
