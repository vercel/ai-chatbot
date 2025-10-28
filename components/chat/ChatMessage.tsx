"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { useCopyToClipboard } from "usehooks-ts";
import { Action, Actions } from "@/components/elements/actions";
import { CopyIcon, ThumbDownIcon, ThumbUpIcon } from "@/components/icons";
import type { Message } from "@/lib/types";
import { cn } from "@/lib/utils";

type ChatMessageProps = {
  message: Message;
};

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const [_, copyToClipboard] = useCopyToClipboard();
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  const handleCopy = async () => {
    if (!message.content) {
      toast.error("There's no text to copy!");
      return;
    }

    await copyToClipboard(message.content);
    toast.success("Copied to clipboard");
  };

  const handleThumbsUp = () => {
    setFeedback("up");
    toast.success("Feedback recorded");
  };

  const handleThumbsDown = () => {
    setFeedback("down");
    toast.success("Feedback recorded");
  };

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="group w-full"
      initial={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
    >
      <div
        className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}
      >
        {/* Assistant avatar on left */}
        {!isUser && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-600 font-semibold text-sm text-white">
            G
          </div>
        )}

        <div className="flex flex-col gap-2">
          <div
            className={cn(
              "rounded-2xl px-4 py-2.5",
              isUser
                ? "max-w-[70%] bg-zinc-100 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100"
                : "w-full bg-transparent text-zinc-900 dark:text-zinc-100"
            )}
          >
            <p className="text-[15px] leading-relaxed">{message.content}</p>
          </div>

          {/* Message actions - only show for assistant messages */}
          {!isUser && (
            <Actions className="-ml-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <Action onClick={handleCopy} tooltip="Copy message">
                <CopyIcon />
              </Action>

              <Action
                className={
                  feedback === "up" ? "text-green-600 hover:text-green-700" : ""
                }
                disabled={feedback === "up"}
                onClick={handleThumbsUp}
                tooltip="Good response"
              >
                <ThumbUpIcon />
              </Action>

              <Action
                className={
                  feedback === "down" ? "text-red-600 hover:text-red-700" : ""
                }
                disabled={feedback === "down"}
                onClick={handleThumbsDown}
                tooltip="Bad response"
              >
                <ThumbDownIcon />
              </Action>
            </Actions>
          )}
        </div>

        {/* User avatar on right */}
        {isUser && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 font-semibold text-sm text-white dark:bg-zinc-200 dark:text-zinc-800">
            U
          </div>
        )}
      </div>
    </motion.div>
  );
}
