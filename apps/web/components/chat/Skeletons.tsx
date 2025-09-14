"use client";

import React from "react";

export function TypingDots({ className = "" }: { className?: string }) {
  return (
    <div className={"flex items-center gap-1 " + className} aria-label="Digitando">
      <span className="size-2 rounded-full bg-zinc-300 animate-bounce [animation-delay:-0.2s]" />
      <span className="size-2 rounded-full bg-zinc-300 animate-bounce [animation-delay:-0.1s]" />
      <span className="size-2 rounded-full bg-zinc-300 animate-bounce" />
    </div>
  );
}

export function MessageSkeleton({ role = 'assistant' as const }: { role?: 'user' | 'assistant' }) {
  const align = role === 'user' ? 'self-end bg-primary/10' : 'self-start bg-muted';
  return (
    <div className="flex flex-col">
      <div className={`rounded-md px-3 py-2 ${align}`}>
        <div className="h-3 w-56 bg-zinc-200 rounded mb-2" />
        <div className="h-3 w-36 bg-zinc-200 rounded" />
      </div>
    </div>
  );
}

