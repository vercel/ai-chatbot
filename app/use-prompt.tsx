import { useState, useCallback, useRef, useEffect } from "react";
import { type Message } from "@prisma/client";
import { nanoid } from "@/lib/utils";

export function usePrompt({
  messages = [],
  _id,
}: {
  messages?: Message[];
  _id: string | undefined | null;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [messageList, setMessageList] = useState(messages);

  const isLoadingRef = useRef(isLoading);
  const messageListRef = useRef(messageList);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    messageListRef.current = messageList;
  }, [messageList]);

  const appendUserMessage = useCallback(async (content: string | Message) => {
    // Prevent multiple requests at once
    if (isLoadingRef.current) return;

    const userMsg =
      typeof content === "string"
        ? ({ id: nanoid(10), role: "user", content } as Message)
        : content;
    const assMsg = {
      id: nanoid(10),
      role: "assistant",
      content: "",
    } as Message;
    const messageListSnapshot = messageListRef.current;

    // Reset output
    setIsLoading(true);

    try {
      // Set user input immediately
      setMessageList([...messageListSnapshot, userMsg]);

      // If streaming, we need to use fetchEventSource directly
      const response = await fetch(`/api/generate`, {
        method: "POST",
        body: JSON.stringify({
          messages: [...messageListSnapshot, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
        headers: { "Content-Type": "application/json" },
      });
      // This data is a ReadableStream
      const data = response.body;
      if (!data) {
        return;
      }

      const reader = data.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedValue = ""; // Variable to accumulate chunks

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        accumulatedValue += chunkValue; // Accumulate the chunk value

        // Check if the accumulated value contains the delimiter
        const delimiter = "\n";
        const chunks = accumulatedValue.split(delimiter);

        // Process all chunks except the last one (which may be incomplete)
        while (chunks.length > 1) {
          const chunkToDispatch = chunks.shift(); // Get the first chunk
          if (chunkToDispatch && chunkToDispatch.length > 0) {
            const chunk = JSON.parse(chunkToDispatch);
            assMsg.content += chunk;
            setMessageList([...messageListSnapshot, userMsg, assMsg]);
          }
        }

        // The last chunk may be incomplete, so keep it in the accumulated value
        accumulatedValue = chunks[0];
      }

      // Process any remaining accumulated value after the loop is done
      if (accumulatedValue.length > 0) {
        assMsg.content += accumulatedValue;
        setMessageList([...messageListSnapshot, userMsg, assMsg]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reloadLastMessage = useCallback(async () => {
    // Prevent multiple requests at once
    if (isLoadingRef.current) return;

    const userMsg = messageListRef.current.at(-2);
    const assMsg = messageListRef.current.at(-1);

    // Both should exist.
    if (!userMsg || !assMsg) return;

    messageListRef.current = messageListRef.current.slice(0, -2);
    setMessageList(messageListRef.current);

    await appendUserMessage(userMsg);
  }, [appendUserMessage]);

  return {
    messageList,
    appendUserMessage,
    reloadLastMessage,
    isLoading,
  };
}
