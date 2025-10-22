"use client";

import { cn } from "@/lib/utils";

type MessageSkeletonProps = {
  className?: string;
};

export function MessageSkeleton(props: MessageSkeletonProps) {
  const { className } = props;
  return (
    <div aria-hidden className={cn("fade-in-0 animate-in", className)}>
      <div className="flex flex-col gap-2">
        <div className="h-3 w-4/5 animate-pulse rounded-md bg-foreground/10" />
        <div className="h-3 w-3/5 animate-pulse rounded-md bg-foreground/10" />
        <div className="h-3 w-2/5 animate-pulse rounded-md bg-foreground/10" />
      </div>
    </div>
  );
}

export default MessageSkeleton;
