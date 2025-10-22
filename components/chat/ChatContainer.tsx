"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Message } from "@/lib/types";
import { ChatMessages } from "./ChatMessages";
import { SimpleChatInput } from "./SimpleChatInput";
import type { SuggestionChip } from "@/components/SuggestionChips";
import { allDemoFlows } from "@/config/demoScript";
import { suggestionChips } from "@/config/suggestionChips";

type ChatContainerProps = {
  initialMessages: Message[];
  enableVoiceDemo?: boolean;
  onAvatarStateChange?: (
    state: "idle" | "listening" | "thinking" | "speaking"
  ) => void;
  onAvatarTextChange?: (text?: string) => void;
};

export function ChatContainer({
  initialMessages,
  enableVoiceDemo = false,
  onAvatarStateChange,
  onAvatarTextChange,
}: ChatContainerProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [activeFollowUps, setActiveFollowUps] = useState<SuggestionChip[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (message: string) => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    requestAnimationFrame(scrollToBottom);

    // Check if we have a scripted flow for this message - flexible keyword matching
    const normalizedMessage = message.toLowerCase().trim();
    const flow = Object.values(allDemoFlows).find((f) => {
      const promptLower = f.userPrompt.toLowerCase();
      const titleLower = f.title.toLowerCase();

      // Extract keywords from the flow to match against
      const keywords = [
        ...f.id.split('-'),
        ...titleLower.split(' '),
        ...promptLower.split(' ').filter(w => w.length > 3),
      ];

      // Check if message contains key phrases or multiple keywords
      return (
        // Exact or partial prompt match
        promptLower.includes(normalizedMessage) ||
        normalizedMessage.includes(promptLower) ||
        // Title match
        normalizedMessage.includes(titleLower) ||
        titleLower.includes(normalizedMessage) ||
        // Multiple keyword match (at least 2 keywords present)
        keywords.filter(kw => normalizedMessage.includes(kw)).length >= 2
      );
    });

    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: flow ? flow.avatarResponse : "That's a great question. In my experience, the key is to focus on creating real value for people. Whether it's in healthcare, technology, or leadership, success comes from solving meaningful problems and empowering others to succeed.",
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Show follow-ups if available
      if (flow && flow.followUps) {
        setActiveFollowUps(flow.followUps);
      } else {
        setActiveFollowUps([]);
      }

      requestAnimationFrame(scrollToBottom);
    }, 1000);
  };

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
    requestAnimationFrame(scrollToBottom);
  };

  const handleSuggestedPrompt = (prompt: string) => {
    handleSend(prompt);
  };

  const handleChipClick = (chip: SuggestionChip) => {
    // Check if we have a scripted flow for this chip
    const flow = allDemoFlows[chip.id];

    if (flow) {
      handleSend(flow.userPrompt);
    } else {
      handleSend(chip.text);
    }
  };

  const hasStartedChat = messages.length > 1;

  // Only show pill chips at bottom when we have follow-ups
  // (Large card chips are shown in ChatMessages before chat starts)
  const showChips = activeFollowUps.length > 0;

  return (
    <div className="relative flex h-full flex-col bg-background">
      <div className="flex-1 overflow-y-auto pb-[250px]">
        <ChatMessages
          messages={messages}
          messagesEndRef={messagesEndRef}
          onSuggestedPrompt={handleSuggestedPrompt}
        />
      </div>

      <div className="absolute inset-x-0 bottom-0 border-t bg-background">
        <SimpleChatInput
          addMessage={addMessage}
          enableVoiceDemo={enableVoiceDemo}
          input={input}
          isListening={isListening}
          onAvatarStateChange={onAvatarStateChange}
          onAvatarTextChange={onAvatarTextChange}
          onSend={handleSend}
          setInput={setInput}
          setIsListening={setIsListening}
          followUpChips={activeFollowUps}
          onChipClick={handleChipClick}
          onClearChips={() => setActiveFollowUps([])}
        />
      </div>
    </div>
  );
}
