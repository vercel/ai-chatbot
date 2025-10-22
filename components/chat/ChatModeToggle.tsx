"use client";

import { MessageSquare, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ChatMode = "text" | "voice";

type ChatModeToggleProps = {
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  className?: string;
};

export function ChatModeToggle({
  mode,
  onModeChange,
  className,
}: ChatModeToggleProps) {
  return (
    <TooltipProvider>
      <div
        className={cn(
          "inline-flex items-center rounded-full bg-muted p-1",
          className
        )}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onModeChange("text")}
              className={cn(
                "flex items-center justify-center rounded-full p-2 transition-all",
                mode === "text"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MessageSquare className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Text Chat</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onModeChange("voice")}
              className={cn(
                "flex items-center justify-center rounded-full p-2 transition-all",
                mode === "voice"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Mic className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Voice Chat</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
