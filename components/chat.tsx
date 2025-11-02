/** biome-ignore-all lint/nursery/useSortedClasses: <explanation> */
"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { ChatHeader } from "@/components/chat-header";

import { useArtifactSelector } from "@/hooks/use-artifact";
import { useAutoResume } from "@/hooks/use-auto-resume";

import type { Vote } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";
import type { Attachment, ChatMessage } from "@/lib/types";
import type { AppUsage } from "@/lib/usage";
import { fetcher, fetchWithErrorHandlers, generateUUID } from "@/lib/utils";
import { Artifact } from "./artifact";
import { useDataStream } from "./data-stream-provider";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";
import { getChatHistoryPaginationKey } from "./sidebar-history";
import { StreamingErrorBoundary } from "./streaming-error-boundary";
import { SuggestedActions } from "./suggested-actions";
import { toast } from "./toast";

export function Chat({
  id,
  initialMessages,
  initialChatModel,
  isReadonly,
  autoResume,
  initialLastContext,
  userId,
}: {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  isReadonly: boolean;
  autoResume: boolean;
  initialLastContext?: AppUsage;
  userId: string;
}) {
  const visibilityType = "public";

  const { mutate } = useSWRConfig();
  const { setDataStream, clearDataStream } = useDataStream();

  const [input, setInput] = useState<string>("");
  const [usage, setUsage] = useState<AppUsage | undefined>(initialLastContext);
  const [currentModelId, setCurrentModelId] = useState(initialChatModel);
  const currentModelIdRef = useRef(currentModelId);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    currentModelIdRef.current = currentModelId;
  }, [currentModelId]);

  // Cleanup function to prevent memory leaks
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    clearDataStream();
  }, [clearDataStream]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    resumeStream,
  } = useChat<ChatMessage>({
    id,
    messages: initialMessages,
    experimental_throttle: 100,
    generateId: generateUUID,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      fetch: fetchWithErrorHandlers,
      prepareSendMessagesRequest(request) {
        // Store abort controller for cleanup
        abortControllerRef.current = new AbortController();

        return {
          body: {
            id: request.id,
            message: request.messages.at(-1),
            selectedChatModel: currentModelIdRef.current,
            selectedVisibilityType: visibilityType,
            ...request.body,
          },
          options: {
            signal: abortControllerRef.current.signal,
          },
        };
      },
    }),
    onData: (dataPart) => {
      try {
        setDataStream((ds) => {
          const newStream = ds ? [...ds, dataPart] : [dataPart];
          // Prevent memory leaks by limiting stream size
          return newStream.length > 500 ? newStream.slice(-250) : newStream;
        });

        if (dataPart.type === "data-usage") {
          setUsage(dataPart.data);
        }
      } catch (error) {
        console.error("Error processing data stream:", error);
      }
    },
    onFinish: () => {
      try {
        abortControllerRef.current = null; // Clear controller on finish
        mutate(unstable_serialize(getChatHistoryPaginationKey));
      } catch (error) {
        console.error("Error in onFinish:", error);
      }
    },
    onError: (error) => {
      console.error("Chat error:", error);

      // Clear abort controller on error
      abortControllerRef.current = null;

      if (error instanceof ChatSDKError) {
        toast({
          type: "error",
          description: error.message,
        });
      } else if (error.name !== "AbortError") {
        // Don't show toast for aborted requests
        toast({
          type: "error",
          description: "An error occurred during streaming. Please try again.",
        });
      }

      // Clear problematic data stream on error
      setTimeout(() => {
        clearDataStream();
      }, 1000);
    },
  });

  const searchParams = useSearchParams();
  const query = searchParams.get("query");

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      sendMessage({
        role: "user" as const,
        parts: [{ type: "text", text: query }],
      });

      setHasAppendedQuery(true);
      window.history.replaceState({}, "", `/chat/${id}`);
    }
  }, [query, sendMessage, hasAppendedQuery, id]);

  const { data: votes } = useSWR<Vote[]>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher
  );

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  // Enhanced stop function with cleanup
  const enhancedStop = useCallback(async () => {
    try {
      await stop();
      cleanup();
    } catch (error) {
      console.error("Error stopping stream:", error);
    }
  }, [stop, cleanup]);

  useAutoResume({
    autoResume,
    initialMessages,
    resumeStream,
    setMessages,
  });

  return (
    <>
      <div className="overscroll-behavior-contain flex h-dvh min-w-0 touch-pan-y flex-col bg-background !m-0 !ml-0">
        <ChatHeader />

        {messages.length === 0 ? (
          // Welcome state - different layout for mobile vs desktop
          <>
            {/* Mobile Layout */}
            <div className="md:hidden flex-1 flex flex-col relative">
              {/* Centered greeting */}
              <div className="flex-1 flex flex-col items-center justify-center px-4 text-center pb-32">
                <div className="font-semibold text-2xl mb-2">Hello there!</div>
                <div className="text-xl text-zinc-500 mb-8">
                  How can I help you today?
                </div>

                {attachments.length === 0 && (
                  <div className="w-full max-w-full md:max-w-3xl px-4">
                    <SuggestedActions
                      chatId={id}
                      selectedVisibilityType={visibilityType}
                      sendMessage={sendMessage}
                    />
                  </div>
                )}
              </div>

              {/* Floating input for mobile */}
              <div className="absolute bottom-0 left-0 right-0 z-10 p-2 bg-gradient-to-t from-background via-background/95 to-transparent">
                <div className="mx-auto w-full max-w-full md:max-w-3xl">
                  {!isReadonly && (
                    <div className="bg-background/90 backdrop-blur-md border rounded-2xl shadow-xl">
                      <MultimodalInput
                        attachments={attachments}
                        chatId={id}
                        input={input}
                        messages={messages}
                        onModelChange={setCurrentModelId}
                        selectedModelId={currentModelId}
                        selectedVisibilityType={visibilityType}
                        sendMessage={sendMessage}
                        setAttachments={setAttachments}
                        setInput={setInput}
                        setMessages={setMessages}
                        status={status}
                        stop={enhancedStop}
                        usage={usage}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:flex flex-1 flex-col items-center justify-center px-4">
              <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center px-4 text-center">
                <div className="font-semibold text-2xl md:text-3xl mb-2">
                  Hello there!
                </div>
                <div className="text-xl text-zinc-500 md:text-2xl mb-8">
                  How can I help you today?
                </div>

                {!isReadonly && (
                  <div className="w-full max-w-3xl">
                    <MultimodalInput
                      attachments={attachments}
                      chatId={id}
                      input={input}
                      messages={messages}
                      onModelChange={setCurrentModelId}
                      selectedModelId={currentModelId}
                      selectedVisibilityType={visibilityType}
                      sendMessage={sendMessage}
                      setAttachments={setAttachments}
                      setInput={setInput}
                      setMessages={setMessages}
                      status={status}
                      stop={enhancedStop}
                      usage={usage}
                    />

                    {attachments.length === 0 && (
                      <div className="mt-6">
                        <SuggestedActions
                          chatId={id}
                          selectedVisibilityType={visibilityType}
                          sendMessage={sendMessage}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          // Chat state with messages and floating bottom input
          <div className="flex flex-1 flex-col relative overflow-hidden">
            <div className="flex-1 overflow-y-auto pb-32 md:pb-20 md:mb-20">
              <StreamingErrorBoundary
                onError={(error, errorInfo) => {
                  console.error("Messages component error:", error, errorInfo);
                  // Force cleanup on component error
                  cleanup();
                }}
              >
                <Messages
                  chatId={id}
                  isArtifactVisible={isArtifactVisible}
                  isReadonly={isReadonly}
                  messages={messages}
                  regenerate={regenerate}
                  selectedModelId={initialChatModel}
                  setMessages={setMessages}
                  status={status}
                  votes={votes}
                  userId={userId}
                />
              </StreamingErrorBoundary>
            </div>

            {/* Truly floating input box - positioned absolutely over content */}
            <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none pb-2 md:mr-[6px]">
              {/* Container matching Messages scrollbar layout exactly */}
              <div className="mx-auto max-w-3xl px-2 pointer-events-auto">
                {!isReadonly && (
                  <div className="bg-background/90 backdrop-blur-md border rounded-2xl shadow-xl">
                    <MultimodalInput
                      attachments={attachments}
                      chatId={id}
                      input={input}
                      messages={messages}
                      onModelChange={setCurrentModelId}
                      selectedModelId={currentModelId}
                      selectedVisibilityType={visibilityType}
                      sendMessage={sendMessage}
                      setAttachments={setAttachments}
                      setInput={setInput}
                      setMessages={setMessages}
                      status={status}
                      stop={enhancedStop}
                      usage={usage}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <Artifact
        attachments={attachments}
        chatId={id}
        input={input}
        isReadonly={isReadonly}
        messages={messages}
        regenerate={regenerate}
        selectedModelId={currentModelId}
        selectedVisibilityType={visibilityType}
        sendMessage={sendMessage}
        setAttachments={setAttachments}
        setInput={setInput}
        setMessages={setMessages}
        status={status}
        userId={userId}
        stop={enhancedStop}
        votes={votes}
      />
    </>
  );
}
