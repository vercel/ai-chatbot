"use client";

import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { voiceToast } from "@/components/ui/voice-toast";
import { cn } from "@/lib/utils";

type ChatInputProps = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onVoiceStart?: () => void;
  onVoiceStop?: () => void;
  leftAccessory?: React.ReactNode; // avatar, collapsed on mobile
  className?: string;
};

export function ChatInput(props: ChatInputProps) {
  const {
    value,
    onChange,
    onSubmit,
    onVoiceStart,
    onVoiceStop,
    leftAccessory,
    className,
  } = props;
  const inputId = useId();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        onSubmit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSubmit]);

  return (
    <div
      className={cn(
        "sticky bottom-0 z-20 w-full border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "[padding-bottom:env(safe-area-inset-bottom)]",
        className
      )}
    >
      <div className="mx-auto flex max-w-4xl items-end gap-2 p-3">
        <div className="hidden md:block">{leftAccessory}</div>
        <div className="h-16 w-16 overflow-hidden rounded-xl md:hidden">
          {leftAccessory}
        </div>
        <div className="flex-1">
          <label className="sr-only" htmlFor={inputId}>
            Message input
          </label>
          <Input
            className="text-base md:text-sm"
            id={inputId}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type a message..."
            value={value}
          />
          <div className="mt-1 text-muted-foreground text-xs">
            Press Shift+Enter to send
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Dialog onOpenChange={setOpen} open={open}>
            <DialogTrigger asChild>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      aria-label="Voice controls"
                      onClick={() => setOpen(true)}
                      type="button"
                      variant="secondary"
                    >
                      🎤
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Voice controls</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </DialogTrigger>
            <DialogContent className="sm:-translate-x-1/2 sm:-translate-y-1/2 fixed inset-x-0 bottom-0 z-50 m-0 max-w-none rounded-t-2xl p-4 sm:top-1/2 sm:left-1/2 sm:max-w-lg sm:rounded-2xl">
              <DialogHeader>
                <DialogTitle>Voice controls</DialogTitle>
                <DialogDescription>Start or stop voice input</DialogDescription>
              </DialogHeader>
              <div className="flex items-center justify-center gap-3 py-6">
                <Button
                  aria-label="Start listening"
                  onClick={() => {
                    onVoiceStart?.();
                    voiceToast.listening();
                  }}
                  type="button"
                >
                  Start
                </Button>
                <Button
                  aria-label="Stop listening"
                  onClick={() => {
                    onVoiceStop?.();
                    voiceToast.received();
                    setOpen(false);
                  }}
                  type="button"
                  variant="secondary"
                >
                  Stop
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  aria-label="Send message"
                  onClick={onSubmit}
                  type="button"
                >
                  Send
                </Button>
              </TooltipTrigger>
              <TooltipContent>Shortcut: Shift+Enter</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}

export default ChatInput;
