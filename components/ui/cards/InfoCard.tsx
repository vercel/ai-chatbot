"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type InfoCardProps = {
  icon?: ReactNode;
  title: string;
  body?: ReactNode;
  className?: string;
};

export function InfoCard(props: InfoCardProps) {
  const { icon, title, body, className } = props;
  return (
    <section
      aria-label={title}
      className={cn(
        "rounded-2xl p-4",
        "border border-border/60 border-l-4 border-l-[var(--transcarent-blue)]",
        "bg-[color-mix(in_oklab,var(--surface)_90%,white)] text-foreground shadow-sm transition-transform duration-150 hover:scale-[1.02] hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start gap-3">
        {icon ? (
          <div aria-hidden className="text-xl">
            {icon}
          </div>
        ) : null}
        <div className="flex-1">
          <div className="font-semibold text-sm">{title}</div>
          {body ? (
            <div className="mt-1 text-foreground/80 text-xs">{body}</div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default InfoCard;
