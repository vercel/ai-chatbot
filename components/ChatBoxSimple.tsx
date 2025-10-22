"use client";

import { motion } from "framer-motion";
import { Mic, MicOff, Send } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateMockResponse } from "@/lib/mockData";
import type { Message } from "@/lib/types";
import { cn } from "@/lib/utils";

type ChatBoxSimpleProps = {
  initialMessages: Message[];
};

export default function ChatBoxSimple({ initialMessages }: ChatBoxSimpleProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = () => {
    if (!input.trim()) {
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    // ensure we scroll after DOM updates
    requestAnimationFrame(scrollToBottom);

    // Simulate assistant response after delay
    setTimeout(() => {
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: generateMockResponse(input),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      requestAnimationFrame(scrollToBottom);
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Messages area */}
        <div className="flex-1 space-y-4 overflow-y-auto pr-4 pb-4">
        {messages.map((msg) => (
            <motion.div
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                'max-w-[80%] rounded-2xl px-4 py-3',
              msg.role === 'user'
                ? 'ml-auto bg-primary text-primary-foreground'
                : 'bg-muted text-foreground'
            )}
            initial={{ opacity: 0, y: 8 }}
            key={msg.id}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-sm leading-relaxed">{msg.content}</p>
            </motion.div>
        ))}
        <div ref={messagesEndRef} />
        </div>

      {/* Input area */}
        <div className="border-border border-t pt-4">
        {/* Listening indicator */}
        {isListening && (
            <motion.div
            animate={{ opacity: 1, scale: 1 }}
            className="mb-3 flex items-center gap-2 text-muted-foreground text-sm"
              initial={{ opacity: 0, scale: 0.95 }}
          >
              <div className="h-2 w-2 animate-glenPulse rounded-full bg-primary" />
            Listening...
            </motion.div>
        )}

          <div className="flex items-end gap-2">
          <Textarea
            className="resize-none"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Glen AI..."
            rows={2}
            value={input}
          />

          <Button
            className="shrink-0"
            onClick={() => setIsListening(!isListening)}
            size="icon"
            type="button"
            variant={isListening ? 'default' : 'outline'}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>

          <Button className="shrink-0" onClick={handleSend} size="icon" type="button">
            <Send className="h-4 w-4" />
          </Button>
          </div>
        </div>
      </div>
  </div>
  )
}
