"use client";

import { Pin } from "lucide-react";
import { cn } from "@/lib/utils";

type PinChipProps = {
  pinned: boolean;
  onToggle: () => void;
  className?: string;
};

export function PinChip({ pinned, onToggle, className }: PinChipProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-medium text-xs transition-colors",
        pinned
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-background text-muted-foreground hover:bg-accent",
        className
      )}
      onClick={onToggle}
      type="button"
    >
      <Pin className={cn("h-3 w-3", pinned && "fill-current")} />
      {pinned ? "Pinned" : "Pin"}
    </button>
  );
}
