import type { VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

import { Badge, badgeVariants } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

type Tone = "neutral" | "brand" | "success" | "danger";

const toneClasses: Record<Tone, string> = {
  neutral: "border-border/70",
  brand: "border-blue-300/80 shadow-[0_0_20px_rgba(59,130,246,0.08)]",
  success: "border-emerald-300/80 shadow-[0_0_20px_rgba(16,185,129,0.08)]",
  danger: "border-rose-300/80 shadow-[0_0_20px_rgba(244,63,94,0.08)]",
};

export type ConnectedAppCardProps = {
  title: string;
  description: string;
  status?: string;
  statusVariant?: BadgeVariant;
  statusDetail?: string;
  icon?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  headerClassName?: string;
  tone?: Tone;
  iconAccentClassName?: string;
};

export function ConnectedAppCard({
  title,
  description,
  status,
  statusVariant,
  statusDetail,
  icon,
  children,
  actions,
  footer,
  headerClassName,
  tone = "neutral",
  iconAccentClassName,
}: ConnectedAppCardProps) {
  return (
    <Card className={cn("shadow-sm", toneClasses[tone])}>
      <CardHeader
        className={cn(
          "flex flex-col gap-4 border-b bg-muted/30 py-4 sm:flex-row sm:items-center sm:justify-between",
          headerClassName
        )}
      >
        <div className="flex items-start gap-3">
          {icon ? (
            <div
              className={cn(
                "mt-1 flex size-12 items-center justify-center rounded-2xl border text-primary shadow-sm",
                iconAccentClassName
              )}
            >
              {icon}
            </div>
          ) : null}
          <div>
            <CardTitle className="text-base font-semibold leading-tight">
              {title}
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              {description}
            </CardDescription>
          </div>
        </div>
        <div className="flex w-full flex-col items-start gap-3 text-sm text-muted-foreground sm:w-auto sm:items-end">
          {status ? (
            <Badge variant={statusVariant ?? "outline"}>{status}</Badge>
          ) : null}
          {statusDetail ? <span>{statusDetail}</span> : null}
          {actions ? (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-6 py-6">{children}</CardContent>
      {footer ? (
        <div className="border-t bg-muted/40 px-6 py-4 text-sm text-muted-foreground">
          {footer}
        </div>
      ) : null}
    </Card>
  );
}


