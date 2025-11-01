import type { UseChatHelpers } from "@ai-sdk/react";
import equal from "fast-deep-equal";
import { AnimatePresence, motion } from "framer-motion";
import { memo, useMemo } from "react";
import { useMessages } from "@/hooks/use-messages";
import type { Vote } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";
import type { UIArtifact } from "./artifact";
import { PreviewMessage, ThinkingMessage } from "./message";

type ArtifactMessagesProps = {
  chatId: string;
  status: UseChatHelpers<ChatMessage>["status"];
  votes: Vote[] | undefined;
  messages: ChatMessage[];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  isReadonly: boolean;
  artifactStatus: UIArtifact["status"];
  userId: string;
};

function PureArtifactMessages({
  chatId,
  status,
  votes,
  messages,
  setMessages,
  regenerate,
  isReadonly,
  userId,
}: ArtifactMessagesProps) {
  const {
    containerRef: messagesContainerRef,
    endRef: messagesEndRef,
    onViewportEnter,
    onViewportLeave,
    hasSentMessage,
  } = useMessages({
    status,
  });

  return (
    <div
      className="flex h-full flex-col items-center gap-4 overflow-y-scroll px-4 pt-20"
      ref={messagesContainerRef}
    >
    {useMemo(() => {
        const seen = new Set<string>();
        const unique: ChatMessage[] = [];
        for (let i = messages.length - 1; i >= 0; i--) {
          const m = messages[i];
          if (!seen.has(m.id)) { seen.add(m.id); unique.unshift(m); }
        }
        return unique;
    }, [messages]).map((message, index, arr) => (
        <PreviewMessage
          chatId={chatId}
          isLoading={status === "streaming" && index === arr.length - 1}
          isReadonly={isReadonly}
      key={`${message.id}-${index}`}
          message={message}
          regenerate={regenerate}
          requiresScrollPadding={hasSentMessage && index === arr.length - 1}
          setMessages={setMessages}
          userId={userId}
          vote={
            votes
              ? votes.find((vote) => vote.messageId === message.id)
              : undefined
          }
        />
      ))}

      <AnimatePresence mode="wait">
        {(status === "submitted" || (status === "streaming" && !messages.some(m => m.role === "assistant" && m.parts.some(p => p.type === "text" && p.text)))) && <ThinkingMessage key="thinking" />}
      </AnimatePresence>

      <motion.div
        className="min-h-[24px] min-w-[24px] shrink-0"
        onViewportEnter={onViewportEnter}
        onViewportLeave={onViewportLeave}
        ref={messagesEndRef}
      />
    </div>
  );
}

function areEqual(
  prevProps: ArtifactMessagesProps,
  nextProps: ArtifactMessagesProps
) {
  if (
    prevProps.artifactStatus === "streaming" &&
    nextProps.artifactStatus === "streaming"
  ) {
    return true;
  }

  if (prevProps.status !== nextProps.status) {
    return false;
  }
  if (prevProps.status && nextProps.status) {
    return false;
  }
  if (prevProps.messages.length !== nextProps.messages.length) {
    return false;
  }
  if (!equal(prevProps.votes, nextProps.votes)) {
    return false;
  }

  return true;
}

export const ArtifactMessages = memo(PureArtifactMessages, areEqual);
