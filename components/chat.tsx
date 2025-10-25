"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
import { SuggestedActions } from "./suggested-actions";
import { toast } from "./toast";

export function Chat({
  id,
  initialMessages,
  initialChatModel,
  isReadonly,
  autoResume,
  initialLastContext,
}: {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  isReadonly: boolean;
  autoResume: boolean;
  initialLastContext?: AppUsage;
}) {
  const visibilityType = "public";

  const { mutate } = useSWRConfig();
  const { setDataStream } = useDataStream();

  const [input, setInput] = useState<string>("");
  const [usage, setUsage] = useState<AppUsage | undefined>(initialLastContext);
  const [currentModelId, setCurrentModelId] = useState(initialChatModel);
  const currentModelIdRef = useRef(currentModelId);

  useEffect(() => {
    currentModelIdRef.current = currentModelId;
  }, [currentModelId]);

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
        return {
          body: {
            id: request.id,
            message: request.messages.at(-1),
            selectedChatModel: currentModelIdRef.current,
            selectedVisibilityType: visibilityType,
            ...request.body,
          },
        };
      },
    }),
    onData: (dataPart) => {
      setDataStream((ds) => (ds ? [...ds, dataPart] : []));
      if (dataPart.type === "data-usage") {
        setUsage(dataPart.data);
      }
    },
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    onError: (error) => {
      if (error instanceof ChatSDKError) {
        toast({
          type: "error",
          description: error.message,
        });
      }
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

  useAutoResume({
    autoResume,
    initialMessages,
    resumeStream,
    setMessages,
  });

  return (
    <>
      <div className="overscroll-behavior-contain flex h-dvh min-w-0 touch-pan-y flex-col bg-background">
        <ChatHeader />

        {messages.length === 0 ? (
          // Welcome state - different layout for mobile vs desktop
          <>
            {/* Mobile Layout */}
            <div className="md:hidden flex-1 flex flex-col">
              {/* Centered greeting */}
              <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
                <div className="font-semibold text-2xl mb-2">
                  Hello there!
                </div>
                <div className="text-xl text-zinc-500 mb-8">
                  How can I help you today?
                </div>
                
                {attachments.length === 0 && (
                  <div className="w-full max-w-3xl px-4">
                    <SuggestedActions
                      chatId={id}
                      selectedVisibilityType={visibilityType}
                      sendMessage={sendMessage}
                    />
                  </div>
                )}
              </div>
              
              {/* Bottom input for mobile */}
              {!isReadonly && (
                <div className="sticky bottom-0 z-1 mx-auto flex w-full max-w-3xl gap-2 border-t-0 bg-background p-2 mb-2">
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
                    stop={stop}
                    usage={usage}
                  />
                </div>
              )}
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
                      stop={stop}
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
          // Chat state with messages and bottom input
          <>
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
            />

            <div className="sticky bottom-0 z-1 mx-auto flex w-full max-w-3xl gap-2 border-t-0 bg-background p-2 mb-2">
              {!isReadonly && (
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
                  stop={stop}
                  usage={usage}
                />
              )}
            </div>
          </>
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
        stop={stop}
        votes={votes}
      />
    </>
  );
}
