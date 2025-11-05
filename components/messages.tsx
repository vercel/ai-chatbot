     
/** biome-ignore-all lint/nursery/useSortedClasses: <explanation> */
import type { UseChatHelpers } from "@ai-sdk/react";
import equal from "fast-deep-equal";
import { AnimatePresence } from "framer-motion";
import { ArrowDownIcon } from "lucide-react";
import { memo, useEffect, useMemo, useRef } from "react";
import { useMessages } from "@/hooks/use-messages";
import type { Vote } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";
import { useDataStream } from "./data-stream-provider";
import { Conversation, ConversationContent } from "./elements/conversation";
import { PreviewMessage, ThinkingMessage } from "./message";

// Re-export for other components
export { PreviewMessage, ThinkingMessage } from "./message";

type MessagesProps = {
  chatId: string;
  status: UseChatHelpers<ChatMessage>["status"];
  votes: Vote[] | undefined;
  messages: ChatMessage[];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  isReadonly: boolean;
  isArtifactVisible: boolean;
  selectedModelId: string;
  userId: string;
};

function PureMessages({
  chatId,
  status,
  votes,
  messages,
  setMessages,
  regenerate,
  isReadonly,
  selectedModelId,
  userId,
}: MessagesProps) {
  const {
    containerRef: messagesContainerRef,
    endRef: messagesEndRef,
    isAtBottom,
    scrollToBottom,
    hasSentMessage,
  } = useMessages({
    status,
  });

  useDataStream();

  useEffect(() => {
    if (status === "submitted") {
      requestAnimationFrame(() => {
        const container = messagesContainerRef.current;
        if (container) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth",
          });
        }
      });
    }
  }, [status, messagesContainerRef]);

  // De-duplicate messages by id, keeping the last occurrence to avoid duplicate React keys
  const uniqueMessages = useMemo(() => {
    const seen = new Set<string>();
    const out: ChatMessage[] = [];
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (!seen.has(m.id)) {
        seen.add(m.id);
        out.unshift(m);
      }
    }
    return out;
  }, [messages]);

  // Determine whether to show a loader and which variant, and where to place it
  const { showLoader, loaderVariant, lastUserIndex, hasAssistantAfterUser } = useMemo(() => {
    const hasAssistantContent = uniqueMessages.some(
      (m) =>
        m.role === "assistant" &&
        m.parts.some((p: any) =>
          (p.type === "text" && !!(p as any).text) ||
          (p as any).type === "image"
        )
    );

    const show = status === "submitted" || (status === "streaming" && !hasAssistantContent);

    const isImageModel = (selectedModelId || "").startsWith("stability/") || [
      "sd3.5-large",
      "sd3.5-large-turbo",
      "sd3.5-medium",
      "sd3.5-flash",
      "imagen-4.0-generate-001",
      "hf/stable-diffusion-2-1",
    ].includes(selectedModelId);

    const variant = isImageModel
      ? ("image" as const)
      : uniqueMessages.some((m) =>
          m.role === "assistant" && m.parts.some((p: any) => (p as any).type === "image")
        )
      ? ("image" as const)
      : ("text" as const);

  // Place the loader right after the latest user message
    let idx = -1;
    for (let i = uniqueMessages.length - 1; i >= 0; i--) {
      if (uniqueMessages[i].role === "user") {
        idx = i;
        break;
      }
    }

  // Determine if there is already an assistant right after this user
  const hasAssistant = idx >= 0 && uniqueMessages[idx + 1]?.role === "assistant";

  return { showLoader: show, loaderVariant: variant, lastUserIndex: idx, hasAssistantAfterUser: !!hasAssistant };
  }, [uniqueMessages, selectedModelId, status]);

  return (
    <div className="flex-1 min-w-0 overflow-hidden" ref={messagesContainerRef}>
      <Conversation
        // Use a single scroll container; center via mx-auto
        className="mx-auto w-full max-w-3xl px-2 overscroll-contain -webkit-overflow-scrolling-touch"
        style={{ overflowAnchor: "none" }}
      >
        <ConversationContent className="flex flex-col gap-2 md:gap-2 py-2 pb-32">
    {uniqueMessages.map((message, index) => (
            <>
              <PreviewMessage
                chatId={chatId}
                isLoading={
                  status === "streaming" && uniqueMessages.length - 1 === index
                }
                isReadonly={isReadonly}
                key={`${message.id}-${index}`}
                message={message}
                regenerate={regenerate}
                requiresScrollPadding={
                  hasSentMessage && index === uniqueMessages.length - 1
                }
                setMessages={setMessages}
                userId={userId}
                vote={
                  votes
                    ? votes.find((vote) => vote.messageId === message.id)
                    : undefined
                }
              />

              <AnimatePresence mode="wait">
                {showLoader && !hasAssistantAfterUser && index === lastUserIndex && (
                  <ThinkingMessage key="thinking" variant={loaderVariant} />
                )}
              </AnimatePresence>
            </>
          ))}

          <div
            className="min-h-6 min-w-6 shrink-0"
            ref={messagesEndRef}
          />
        </ConversationContent>
  </Conversation>

  {!isAtBottom && (
        <button
          aria-label="Scroll to bottom"
          className="-translate-x-1/2 absolute bottom-40 left-1/2 z-10 rounded-full border bg-background p-2 shadow-lg transition-colors hover:bg-muted"
          onClick={() => scrollToBottom("smooth")}
          type="button"
        >
          <ArrowDownIcon className="size-4" />
        </button>
      )}
    </div>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.isArtifactVisible && nextProps.isArtifactVisible) {
    return true;
  }

  if (prevProps.status !== nextProps.status) {
    return false;
  }
  if (prevProps.selectedModelId !== nextProps.selectedModelId) {
    return false;
  }
  if (prevProps.messages.length !== nextProps.messages.length) {
    return false;
  }
  if (!equal(prevProps.messages, nextProps.messages)) {
    return false;
  }
  if (!equal(prevProps.votes, nextProps.votes)) {
    return false;
  }

  return false;
});