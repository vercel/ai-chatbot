"use client";

import { cn } from "@/lib/utils";

type TypingIndicatorProps = {
  className?: string;
};

export function TypingIndicator(props: TypingIndicatorProps) {
  const { className } = props;
  return (
    <output
      aria-live="polite"
      className={cn("flex items-center gap-1", className)}
    >
      <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-[var(--transcarent-blue)] [animation-delay:0ms]" />
      <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-[var(--transcarent-blue)] [animation-delay:120ms]" />
      <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-[var(--transcarent-blue)] [animation-delay:240ms]" />
      <span className="sr-only">Assistant is typing</span>
    </output>
  );
}

export default TypingIndicator;
