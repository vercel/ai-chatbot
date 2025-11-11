"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { usePathname, useSearchParams } from "next/navigation";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useRef, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useArtifactSelector } from "@/hooks/use-artifact";
import { useAutoResume } from "@/hooks/use-auto-resume";
import { useChatVisibility } from "@/hooks/use-chat-visibility";
import type { Vote } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";
import type { Attachment, ChatMessage } from "@/lib/types";
import type { AppUsage } from "@/lib/usage";
import { fetcher, fetchWithErrorHandlers, generateUUID } from "@/lib/utils";
import { Artifact } from "../artifact/artifact";
import { useDataStream } from "../shared/data-stream-provider";
import { Messages } from "../chat/messages";
import { MultimodalInput } from "../input/multimodal-input";
import { getChatHistoryPaginationKey } from "../sidebar/sidebar-history";
import { toast } from "../shared/toast";
import type { VisibilityType } from "../shared/visibility-selector";
import { ChatStatusBar } from "./chat-status-bar";

export function ChatSidebarContent({
  chatId,
  initialChatModel,
  initialMessages,
  initialVisibilityType,
  isReadonly,
  autoResume,
  onMessagesChange,
  onArtifactPropsReady,
}: {
  chatId: string;
  initialChatModel: string;
  initialMessages: ChatMessage[];
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  autoResume: boolean;
  onMessagesChange?: (messages: ChatMessage[]) => void;
  onArtifactPropsReady?: (props: {
    attachments: Attachment[];
    chatId: string;
    input: string;
    isReadonly: boolean;
    messages: ChatMessage[];
    regenerate: UseChatHelpers<ChatMessage>["regenerate"];
    selectedModelId: string;
    selectedVisibilityType: VisibilityType;
    sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
    setAttachments: Dispatch<SetStateAction<Attachment[]>>;
    setInput: Dispatch<SetStateAction<string>>;
    setMessages: UseChatHelpers<ChatMessage>["setMessages"];
    status: UseChatHelpers<ChatMessage>["status"];
    stop: UseChatHelpers<ChatMessage>["stop"];
    votes: Vote[] | undefined;
  }) => void;
}) {
  const { visibilityType } = useChatVisibility({
    chatId,
    initialVisibilityType,
  });

  const { mutate } = useSWRConfig();
  const { setDataStream } = useDataStream();

  const [input, setInput] = useState<string>("");
  const [usage, setUsage] = useState<AppUsage | undefined>(undefined);
  const [showCreditCardAlert, setShowCreditCardAlert] = useState(false);
  const [currentModelId, setCurrentModelId] = useState(initialChatModel);
  const currentModelIdRef = useRef(currentModelId);

  useEffect(() => {
    currentModelIdRef.current = currentModelId;
  }, [currentModelId]);

  // Load messages when chatId changes (for existing chats from URL)
  // Fetch messages if autoResume is true (meaning chatId came from URL)
  const { data: fetchedMessages } = useSWR<ChatMessage[]>(
    autoResume ? `/api/chat/${chatId}/messages` : null,
    async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) {
        return [];
      }
      const data = await response.json() as { messages?: ChatMessage[] };
      return data.messages || [];
    }
  );

  // Use fetched messages if available, otherwise use initialMessages
  const messagesToUse = autoResume && fetchedMessages ? fetchedMessages : initialMessages;

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    resumeStream,
  } = useChat<ChatMessage>({
    id: chatId,
    messages: messagesToUse,
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
        if (
          error.message?.includes("AI Gateway requires a valid credit card")
        ) {
          setShowCreditCardAlert(true);
        } else {
          toast({
            type: "error",
            description: error.message,
          });
        }
      }
    },
  });

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isDashboardRoute = pathname?.startsWith("/dashboard");
  const query = searchParams.get("query");

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      sendMessage({
        role: "user" as const,
        parts: [{ type: "text", text: query }],
      });

      setHasAppendedQuery(true);
      // Only navigate if not on dashboard route
      if (!isDashboardRoute) {
        window.history.replaceState({}, "", `/chat/${chatId}`);
      }
    }
  }, [query, sendMessage, hasAppendedQuery, chatId, isDashboardRoute]);

  const { data: votes } = useSWR<Vote[]>(
    messages.length >= 2 ? `/api/vote?chatId=${chatId}` : null,
    fetcher
  );

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  // Update messages when fetched messages load (for existing chats)
  useEffect(() => {
    if (autoResume && fetchedMessages && fetchedMessages.length > 0) {
      // Only update if current messages are empty or different
      // This handles the case where messages load after useChat initializes
      if (messages.length === 0 || messages.length !== fetchedMessages.length) {
        setMessages(fetchedMessages);
      }
    }
  }, [fetchedMessages, autoResume, setMessages, messages.length]);

  useAutoResume({
    autoResume,
    initialMessages: messagesToUse,
    resumeStream,
    setMessages,
  });

  useEffect(() => {
    onMessagesChange?.(messages);
  }, [messages, onMessagesChange]);

  useEffect(() => {
    if (onArtifactPropsReady && isArtifactVisible) {
      onArtifactPropsReady({
        attachments,
        chatId,
        input,
        isReadonly,
        messages,
        regenerate,
        selectedModelId: currentModelId,
        selectedVisibilityType: visibilityType,
        sendMessage,
        setAttachments,
        setInput,
        setMessages,
        status,
        stop,
        votes,
      });
    }
  }, [
    attachments,
    chatId,
    input,
    isArtifactVisible,
    isReadonly,
    messages,
    onArtifactPropsReady,
    regenerate,
    currentModelId,
    visibilityType,
    sendMessage,
    setAttachments,
    setInput,
    setMessages,
    status,
    stop,
    votes,
  ]);

  return (
    <>
      <div className="flex h-full flex-1 flex-col overflow-hidden bg-transparent">
        <div className="flex flex-1 flex-col overflow-hidden">
          <Messages
            chatId={chatId}
            isArtifactVisible={isArtifactVisible}
            isReadonly={isReadonly}
            messages={messages}
            regenerate={regenerate}
            selectedModelId={initialChatModel}
            setMessages={setMessages}
            status={status}
            votes={votes}
          />
        </div>

        <div className="sticky bottom-0 z-1 flex w-full flex-col gap-0 border-t-0 bg-transparent">
          {!isReadonly && (
            <>
              <div className="flex w-full gap-2 pb-1.5">
                <MultimodalInput
                  attachments={attachments}
                  chatId={chatId}
                  input={input}
                  messages={messages}
                  selectedModelId={currentModelId}
                  selectedVisibilityType={visibilityType}
                  sendMessage={sendMessage}
                  setAttachments={setAttachments}
                  setInput={setInput}
                  setMessages={setMessages}
                  status={status}
                  stop={stop}
                />
              </div>
              <ChatStatusBar
                onModelChange={setCurrentModelId}
                selectedModelId={currentModelId}
                usage={usage}
              />
            </>
          )}
        </div>
      </div>

      <AlertDialog
        onOpenChange={setShowCreditCardAlert}
        open={showCreditCardAlert}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate AI Gateway</AlertDialogTitle>
            <AlertDialogDescription>
              This application requires{" "}
              {process.env.NODE_ENV === "production" ? "the owner" : "you"} to
              activate Vercel AI Gateway.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                window.open(
                  "https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%3Fmodal%3Dadd-credit-card",
                  "_blank"
                );
                window.location.href = "/";
              }}
            >
              Activate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

