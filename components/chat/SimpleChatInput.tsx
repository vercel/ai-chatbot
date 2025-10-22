"use client";

import { motion } from "framer-motion";
import { Mic, MicOff, Send } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Message } from "@/lib/types";
import type { SuggestionChip } from "@/components/SuggestionChips";
import { cn } from "@/lib/utils";
import { useSimulatedVoiceChat } from "@/components/avatar/hooks/useSimulatedVoiceChat";

type SimpleChatInputProps = {
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  isListening: boolean;
  setIsListening: Dispatch<SetStateAction<boolean>>;
  onSend: (message: string, mockResponse?: string) => void;
  enableVoiceDemo?: boolean;
  onAvatarStateChange?: (state: "idle" | "listening" | "thinking" | "speaking") => void;
  onAvatarTextChange?: (text?: string) => void;
  addMessage: (message: Message) => void;
  followUpChips?: SuggestionChip[];
  onChipClick?: (chip: SuggestionChip) => void;
  onClearChips?: () => void;
};

export function SimpleChatInput({
  input,
  setInput,
  isListening,
  setIsListening,
  onSend,
  enableVoiceDemo = false,
  onAvatarStateChange,
  onAvatarTextChange,
  addMessage,
  followUpChips = [],
  onChipClick,
  onClearChips,
}: SimpleChatInputProps) {
  // Simulated voice chat for demos
  const voiceChat = useSimulatedVoiceChat((response) => {
    // Add voice response to messages
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: response,
    };
    addMessage(assistantMessage);

    // Update avatar text
    if (onAvatarTextChange) {
      onAvatarTextChange(response);
    }
  });

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMicClick = () => {
    if (enableVoiceDemo && !voiceChat.isActive) {
      voiceChat.startListening();

      // Add user transcript to messages after listening completes
      setTimeout(() => {
        if (voiceChat.transcript) {
          const userMessage: Message = {
            id: crypto.randomUUID(),
            role: "user",
            content: voiceChat.transcript,
          };
          addMessage(userMessage);
        }
      }, 2000);
    } else if (enableVoiceDemo && voiceChat.isActive) {
      voiceChat.stopListening();
    } else {
      setIsListening(!isListening);
    }
  };

  // Sync listening state with voice chat
  useEffect(() => {
    if (enableVoiceDemo) {
      setIsListening(voiceChat.state === "listening");

      // Sync with parent avatar state
      if (onAvatarStateChange) {
        onAvatarStateChange(voiceChat.state);
      }
    }
  }, [voiceChat.state, enableVoiceDemo, setIsListening, onAvatarStateChange]);

  const showChips = followUpChips.length > 0;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-6 pt-4 md:px-6">
      {/* Listening indicator */}
      {isListening && (
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className="mb-3 flex items-center gap-2.5 text-sm text-zinc-600 dark:text-zinc-400"
          initial={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2 }}
        >
          <div className="relative flex h-3 w-3 items-center justify-center">
            <div className="absolute h-full w-full animate-ping rounded-full bg-teal-500 opacity-75" />
            <div className="relative h-2 w-2 rounded-full bg-teal-500" />
          </div>
          <span className="font-medium">Listening...</span>
        </motion.div>
      )}

      <div className="flex items-end gap-2.5">
        <Textarea
          className="min-h-[52px] flex-1 resize-none rounded-3xl border-zinc-300 bg-white px-5 py-3 text-[15px] shadow-sm transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:focus:border-teal-500"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Glen AI..."
          rows={1}
          value={input}
        />

        <Button
          className={cn(
            'h-[52px] w-[52px] shrink-0 rounded-full shadow-sm transition-all',
            isListening
              ? 'bg-teal-500 text-white hover:bg-teal-600'
              : 'border-2 border-zinc-300 bg-white text-zinc-700 hover:border-teal-500 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
          )}
          onClick={handleMicClick}
          size="icon"
          type="button"
        >
          {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>

        <Button
          className="h-[52px] w-[52px] shrink-0 rounded-full bg-teal-500 text-white shadow-sm transition-all hover:bg-teal-600 disabled:opacity-50 disabled:hover:bg-teal-500"
          onClick={handleSend}
          size="icon"
          type="button"
          disabled={!input.trim()}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>

      {/* Follow-up chips below message bar */}
      {showChips && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="mt-3 flex gap-2 overflow-x-auto pb-1"
        >
          {followUpChips.map((chip) => (
            <button
              key={chip.id}
              onClick={() => onChipClick?.(chip)}
              className="shrink-0 rounded-full border border-border bg-card px-4 py-2 text-sm transition-all hover:border-primary hover:bg-accent"
            >
              {chip.text}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
}
