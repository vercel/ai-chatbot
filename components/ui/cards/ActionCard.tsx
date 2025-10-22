"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ActionCardProps = {
  icon: ReactNode;
  title: string;
  description?: string;
  cta?: ReactNode;
  className?: string;
};

export function ActionCard(props: ActionCardProps) {
  const { icon, title, description, cta, className } = props;
  return (
    <section
      aria-label={title}
      className={cn(
        "rounded-2xl p-4",
        "border border-border/50",
        "bg-gradient-to-br from-[var(--transcarent-gold)] to-[color-mix(in_oklab,var(--transcarent-gold-dark)_70%,var(--transcarent-blue)_15%)]",
        "text-[hsl(245,60%,10%)] shadow-sm transition-transform duration-150 hover:scale-[1.02] hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div aria-hidden className="text-2xl">
          {icon}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-sm">{title}</div>
          {description ? (
            <div className="mt-1 text-foreground/80 text-xs">{description}</div>
          ) : null}
          {cta ? <div className="mt-3">{cta}</div> : null}
        </div>
      </div>
    </section>
  );
}

export default ActionCard;
