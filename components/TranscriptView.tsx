"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import Image from "next/image";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";

type TranscriptViewProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
};

export function TranscriptView({
  open,
  onOpenChange,
  conversationHistory,
}: TranscriptViewProps) {
  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="w-full sm:max-w-2xl" side="right">
        <SheetHeader>
          <SheetTitle>Conversation Transcript</SheetTitle>
          <SheetDescription>
            Your conversation history with Glen AI
          </SheetDescription>
        </SheetHeader>

        <div
          className="mt-6 flex flex-col gap-4 overflow-y-auto pb-4"
          style={{ maxHeight: "calc(100vh - 180px)" }}
        >
          {conversationHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-6 py-12 text-center">
              <div className="rounded-full bg-muted p-3">
                <Image
                  alt="Glen AI"
                  className="h-16 w-16 rounded-full object-cover"
                  height={64}
                  src="/Glen-Tullman2.jpg"
                  width={64}
                />
              </div>
              <div>
                <p className="font-semibold text-xl">No conversation yet</p>
                <p className="mt-2 text-muted-foreground text-sm">
                  Start chatting with Glen to see your transcript here
                </p>
              </div>
            </div>
          ) : (
            conversationHistory.map((msg, index) => {
              const timestamp = new Date().toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              });

              return (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  initial={{ opacity: 0, y: 10 }}
                  key={`${index}-${msg.role}`}
                  transition={{ delay: index * 0.05 }}
                >
                  {msg.role === "assistant" ? (
                    <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-border">
                      <Image
                        alt="Glen AI"
                        className="h-full w-full object-cover"
                        height={32}
                        src="/Glen-Tullman2.jpg"
                        width={32}
                      />
                    </div>
                  ) : (
                    <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground text-xs">
                      You
                    </div>
                  )}
                  <div className="flex flex-1 flex-col gap-1">
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        msg.role === "user"
                          ? "ml-auto bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span
                      className={`text-muted-foreground text-xs ${msg.role === "user" ? "text-right" : "text-left"} px-2`}
                    >
                      {timestamp}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        <div className="absolute top-4 right-4">
          <Button
            onClick={() => onOpenChange(false)}
            size="icon"
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
