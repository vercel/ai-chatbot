"use client";

import { type CoreMessage, streamText, type UIMessage } from "ai";
import { useCallback, useRef, useState } from "react";
import {
  createWebLLMModel,
  getWebLLMAvailability,
  type WebLLMAvailability,
  type WebLLMProgress,
} from "@/lib/ai/webllm-client";
import type { ChatMessage } from "@/lib/types";
import { generateUUID } from "@/lib/utils";

type WebLLMChatStatus =
  | "ready"
  | "submitted"
  | "streaming"
  | "error"
  | "loading-model";

interface UseWebLLMChatOptions {
  id: string;
  initialMessages?: ChatMessage[];
  onFinish?: () => void;
  onError?: (error: Error) => void;
}

interface UseWebLLMChatReturn {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  sendMessage: (message: { role: "user"; parts: ChatMessage["parts"] }) => void;
  status: WebLLMChatStatus;
  stop: () => void;
  modelStatus: WebLLMAvailability | "checking" | "loading";
  downloadProgress: WebLLMProgress | null;
  error: Error | null;
}

export function useWebLLMChat({
  id,
  initialMessages = [],
  onFinish,
  onError,
}: UseWebLLMChatOptions): UseWebLLMChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [status, setStatus] = useState<WebLLMChatStatus>("ready");
  const [modelStatus, setModelStatus] = useState<
    WebLLMAvailability | "checking" | "loading"
  >("checking");
  const [downloadProgress, setDownloadProgress] =
    useState<WebLLMProgress | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (message: { role: "user"; parts: ChatMessage["parts"] }) => {
      const userMessage: ChatMessage = {
        id: generateUUID(),
        role: "user",
        parts: message.parts,
        metadata: { createdAt: new Date().toISOString() },
      };

      setMessages((prev) => [...prev, userMessage]);
      setStatus("loading-model");
      setError(null);

      try {
        const availability = await getWebLLMAvailability();
        setModelStatus(availability);

        if (availability === "unavailable") {
          throw new Error(
            "WebLLM is not supported in this browser. Please use a WebGPU-compatible browser like Chrome or Edge."
          );
        }

        if (availability === "downloadable" || availability === "downloading") {
          setModelStatus("loading");
        }

        const model = createWebLLMModel((progress) => {
          setDownloadProgress(progress);
        });

        setStatus("submitted");

        const allMessages: CoreMessage[] = [...messages, userMessage].map(
          (msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.parts
              .filter((p) => p.type === "text")
              .map((p) => (p as { type: "text"; text: string }).text)
              .join("\n"),
          })
        );

        const assistantMessageId = generateUUID();
        const assistantMessage: ChatMessage = {
          id: assistantMessageId,
          role: "assistant",
          parts: [{ type: "text", text: "" }],
          metadata: { createdAt: new Date().toISOString() },
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setStatus("streaming");
        setModelStatus("available");

        abortControllerRef.current = new AbortController();

        const result = streamText({
          model,
          messages: allMessages,
          abortSignal: abortControllerRef.current.signal,
        });

        let fullText = "";
        for await (const chunk of result.textStream) {
          fullText += chunk;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    parts: [{ type: "text", text: fullText }],
                  }
                : msg
            )
          );
        }

        await saveWebLLMMessages(id, userMessage, {
          ...assistantMessage,
          parts: [{ type: "text", text: fullText }],
        });

        setStatus("ready");
        onFinish?.();
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Unknown error occurred");
        if (error.name !== "AbortError") {
          setError(error);
          setStatus("error");
          onError?.(error);
        } else {
          setStatus("ready");
        }
      }
    },
    [messages, id, onFinish, onError]
  );

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
    setStatus("ready");
  }, []);

  return {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    modelStatus,
    downloadProgress,
    error,
  };
}

async function saveWebLLMMessages(
  chatId: string,
  userMessage: ChatMessage,
  assistantMessage: ChatMessage
) {
  try {
    await fetch("/api/chat/webllm-save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId,
        messages: [userMessage, assistantMessage],
      }),
    });
  } catch (err) {
    console.warn("Failed to save WebLLM messages:", err);
  }
}
