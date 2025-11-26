"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { ChatHeader } from "@/components/chat-header";
import { useArtifactSelector } from "@/hooks/use-artifact";
import { useChatVisibility } from "@/hooks/use-chat-visibility";
import { useWebLLMChat } from "@/hooks/use-webllm-chat";
import { getWebLLMQuality } from "@/lib/ai/models";
import type { Vote } from "@/lib/db/schema";
import type { Attachment, ChatMessage } from "@/lib/types";
import { fetcher } from "@/lib/utils";
import { Artifact } from "./artifact";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";
import { getChatHistoryPaginationKey } from "./sidebar-history";
import { toast } from "./toast";
import type { VisibilityType } from "./visibility-selector";
import { WebLLMStatus } from "./webllm-status";

export function WebLLMChat({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  onModelChange,
}: {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  onModelChange: (modelId: string) => void;
}) {
  const { visibilityType } = useChatVisibility({
    chatId: id,
    initialVisibilityType,
  });

  const { mutate } = useSWRConfig();
  const [input, setInput] = useState<string>("");
  const [currentModelId, setCurrentModelId] = useState(initialChatModel);

  // Extract quality hint from the model ID
  const quality = getWebLLMQuality(currentModelId);

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    modelStatus,
    downloadProgress,
    error,
  } = useWebLLMChat({
    id,
    quality,
    initialMessages,
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    onError: (err) => {
      toast({
        type: "error",
        description: err.message,
      });
    },
  });

  const searchParams = useSearchParams();
  const query = searchParams.get("query");

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    if (query && !hasAppendedQuery && modelStatus === "available") {
      sendMessage({
        role: "user" as const,
        parts: [{ type: "text", text: query }],
      });

      setHasAppendedQuery(true);
      window.history.replaceState({}, "", `/chat/${id}`);
    }
  }, [query, sendMessage, hasAppendedQuery, id, modelStatus]);

  const { data: votes } = useSWR<Vote[]>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher
  );

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  const handleModelChange = (modelId: string) => {
    setCurrentModelId(modelId);
    onModelChange(modelId);
  };

  // Map WebLLM status to a compatible status for Messages component
  const chatStatus =
    status === "loading-model"
      ? "submitted"
      : status === "error"
        ? "ready"
        : status;

  // Create adapter functions that match the expected UseChatHelpers types
  const sendMessageAdapter: UseChatHelpers<ChatMessage>["sendMessage"] =
    useCallback(
      (message) => {
        if (message && "parts" in message && message.parts) {
          sendMessage({
            role: "user",
            parts: message.parts,
          });
        }
        return Promise.resolve();
      },
      [sendMessage]
    );

  const regenerateAdapter: UseChatHelpers<ChatMessage>["regenerate"] =
    useCallback(() => {
      // WebLLM doesn't support regeneration in this implementation
      return Promise.resolve();
    }, []);

  const stopAdapter = useCallback(() => {
    stop();
    return Promise.resolve();
  }, [stop]);

  return (
    <>
      <div className="overscroll-behavior-contain flex h-dvh min-w-0 touch-pan-y flex-col bg-background">
        <ChatHeader
          chatId={id}
          isReadonly={isReadonly}
          selectedVisibilityType={initialVisibilityType}
        />

        <div className="mx-auto flex w-full max-w-4xl justify-center px-4 pt-2">
          <WebLLMStatus
            downloadProgress={downloadProgress}
            modelStatus={modelStatus}
          />
        </div>

        {error && (
          <div className="mx-auto w-full max-w-4xl px-4 pt-2">
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-destructive text-sm">
              {error.message}
            </div>
          </div>
        )}

        <Messages
          chatId={id}
          isArtifactVisible={isArtifactVisible}
          isReadonly={isReadonly}
          messages={messages}
          regenerate={regenerateAdapter}
          selectedModelId={currentModelId}
          setMessages={setMessages}
          status={chatStatus}
          votes={votes}
        />

        <div className="sticky bottom-0 z-1 mx-auto flex w-full max-w-4xl gap-2 border-t-0 bg-background px-2 pb-3 md:px-4 md:pb-4">
          {!isReadonly && (
            <MultimodalInput
              attachments={attachments}
              chatId={id}
              input={input}
              messages={messages}
              onModelChange={handleModelChange}
              selectedModelId={currentModelId}
              selectedVisibilityType={visibilityType}
              sendMessage={sendMessageAdapter}
              setAttachments={setAttachments}
              setInput={setInput}
              setMessages={setMessages}
              status={chatStatus}
              stop={stopAdapter}
            />
          )}
        </div>
      </div>

      <Artifact
        attachments={attachments}
        chatId={id}
        input={input}
        isReadonly={isReadonly}
        messages={messages}
        regenerate={regenerateAdapter}
        selectedModelId={currentModelId}
        selectedVisibilityType={visibilityType}
        sendMessage={sendMessageAdapter}
        setAttachments={setAttachments}
        setInput={setInput}
        setMessages={setMessages}
        status={chatStatus}
        stop={stopAdapter}
        votes={votes}
      />
    </>
  );
}
