"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Message, ChatStatus } from "@/lib/types";

type ChatContextValue = {
  // State
  messages: Message[];
  status: ChatStatus;
  isTyping: boolean;

  // Actions
  sendMessage: (content: string, mockResponse?: string) => void;
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  clearMessages: () => void;
  setIsTyping: (isTyping: boolean) => void;
};

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

type ChatProviderProps = {
  children: ReactNode;
  initialMessages?: Message[];
};

export function ChatProvider({
  children,
  initialMessages = [],
}: ChatProviderProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [isTyping, setIsTyping] = useState(false);

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const sendMessage = useCallback(
    (content: string, mockResponse?: string) => {
      if (!content.trim()) return;

      // Add user message
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      };
      addMessage(userMessage);

      // Simulate thinking
      setIsTyping(true);
      setStatus("streaming");

      // Simulate response
      setTimeout(() => {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            mockResponse ||
            "I understand your question. Let me help you with that.",
          createdAt: new Date().toISOString(),
        };
        addMessage(assistantMessage);
        setIsTyping(false);
        setStatus("idle");
      }, 800);
    },
    [addMessage]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setStatus("idle");
    setIsTyping(false);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages,
        status,
        isTyping,
        sendMessage,
        addMessage,
        setMessages,
        clearMessages,
        setIsTyping,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within ChatProvider");
  }
  return context;
}
