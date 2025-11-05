"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { useEffect } from "react";
import { useDataStream } from "@/components/data-stream-provider";
import type { ChatMessage } from "@/lib/types";

export type UseAutoResumeParams = {
  autoResume: boolean;
  initialMessages: ChatMessage[];
  resumeStream: UseChatHelpers<ChatMessage>["resumeStream"];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
};

export function useAutoResume({
  autoResume,
  initialMessages,
  resumeStream,
  setMessages,
}: UseAutoResumeParams) {
  const { dataStream } = useDataStream();

  useEffect(() => {
    if (!autoResume) {
      return;
    }

    const mostRecentMessage = initialMessages.at(-1);

    if (mostRecentMessage?.role === "user") {
      resumeStream();
    }

    // we intentionally run this once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoResume, initialMessages.at, resumeStream]);

  useEffect(() => {
    if (!dataStream || dataStream.length === 0) return;
    const dataPart = dataStream[0];
    if (dataPart.type !== "data-appendMessage") return;

    try {
      const appended = JSON.parse(dataPart.data);
      setMessages((prev) => {
        if (prev.some((m) => m.id === appended.id)) return prev;
        let insertIdx = -1;
        for (let i = prev.length - 1; i >= 0; i--) {
          if (prev[i].role === "user") { insertIdx = i; break; }
        }
        if (insertIdx === -1) return [...prev, appended];
        const out = [...prev];
        const nextIdx = insertIdx + 1;
        if (nextIdx < out.length && out[nextIdx].role === "assistant") {
          out.splice(nextIdx + 1, 0, appended);
        } else {
          out.splice(nextIdx, 0, appended);
        }
        return out;
      });
    } catch {}
  }, [dataStream, setMessages]);
}
