"use client";

import type { CSSProperties, ReactNode } from "react";
import type { GridPosition } from "./types";
import { cn } from "@/lib/utils";

export type ViewBlockProps = {
  id: string;
  type: string;
  position: GridPosition;
  children: ReactNode;
};

export function ViewBlock({
  id,
  type,
  position,
  children,
}: ViewBlockProps) {
  const style: CSSProperties = {
    gridColumn: `span ${Math.max(1, Math.min(position.width, 12))} / span ${Math.max(
      1,
      Math.min(position.width, 12)
    )}`,
    gridRow: `span ${Math.max(1, Math.min(position.height, 12))} / span ${Math.max(
      1,
      Math.min(position.height, 12)
    )}`,
  };

  return (
    <section
      aria-labelledby={`block-${id}`}
      className={cn(
        "flex flex-col rounded-lg border border-border/60 bg-background shadow-sm",
        "overflow-hidden"
      )}
      style={style}
    >
      <header
        id={`block-${id}`}
        className="flex items-center justify-between border-b border-border/70 bg-muted/60 px-4 py-2 text-sm font-medium uppercase tracking-wide text-muted-foreground"
      >
        <span>{type} block</span>
        <span className="font-mono text-xs text-muted-foreground/80">
          {id}
        </span>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </section>
  );
}

