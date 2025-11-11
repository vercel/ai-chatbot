"use client";

import { useState } from "react";
import { saveChatModelAsCookie } from "@/app/(chat)/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { SelectItem } from "@/components/ui/select";
import { chatModels } from "@/lib/ai/models";
import { PromptInputModelSelect, PromptInputModelSelectContent } from "@/components/elements/prompt-input";
import { Trigger } from "@radix-ui/react-select";
import { ContextIcon } from "@/components/elements/context";
import { CpuIcon, PenIcon } from "@/components/shared/icons";
import { SignatureIcon } from "lucide-react";
import type { AppUsage } from "@/lib/usage";
import { startTransition } from "react";

type InfoRowProps = {
  label: string;
  tokens?: number;
  costText?: string;
};

function InfoRow({ label, tokens, costText }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2 font-mono">
        <span className="min-w-[4ch] text-right">
          {tokens === undefined ? "—" : tokens.toLocaleString()}
        </span>
        {costText !== undefined &&
          costText !== null &&
          !Number.isNaN(Number.parseFloat(costText)) && (
            <span className="text-muted-foreground">
              ${Number.parseFloat(costText).toFixed(6)}
            </span>
          )}
      </div>
    </div>
  );
}

function ContextUsageButton({ usage }: { usage?: AppUsage }) {
  const used = usage?.totalTokens ?? 0;
  const max =
    usage?.context?.totalMax ??
    usage?.context?.combinedMax ??
    usage?.context?.inputMax;
  const hasMax = typeof max === "number" && Number.isFinite(max) && max > 0;
  const usedPercent = hasMax ? Math.min(100, (used / max) * 100) : 0;
  const [showCompressDialog, setShowCompressDialog] = useState(false);

  return (
    <>
      <HoverCard>
        <HoverCardTrigger asChild>
          <Button
            className="h-5 px-1.5 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setShowCompressDialog(true)}
            type="button"
            variant="ghost"
          >
            <div className="size-3.5 [&>svg]:size-3.5">
              <ContextIcon percent={usedPercent} />
            </div>
            <span className="ml-1 hidden sm:inline text-[10px]">
              {usedPercent.toFixed(0)}%
            </span>
          </Button>
        </HoverCardTrigger>
        <HoverCardContent align="start" className="w-64 p-3" side="top">
          <div className="space-y-2">
            <div className="flex items-start justify-between text-sm">
              <span>{usedPercent.toFixed(1)}%</span>
              <span className="text-muted-foreground">
                {hasMax ? `${used} / ${max} tokens` : `${used} tokens`}
              </span>
            </div>
            <div className="space-y-2">
              <Progress className="h-2 bg-muted" value={usedPercent} />
            </div>
            <div className="mt-1 space-y-1">
              {usage?.cachedInputTokens && usage.cachedInputTokens > 0 && (
                <InfoRow
                  costText={usage?.costUSD?.cacheReadUSD?.toString()}
                  label="Cache Hits"
                  tokens={usage?.cachedInputTokens}
                />
              )}
              <InfoRow
                costText={usage?.costUSD?.inputUSD?.toString()}
                label="Input"
                tokens={usage?.inputTokens}
              />
              <InfoRow
                costText={usage?.costUSD?.outputUSD?.toString()}
                label="Output"
                tokens={usage?.outputTokens}
              />
              <InfoRow
                costText={usage?.costUSD?.reasoningUSD?.toString()}
                label="Reasoning"
                tokens={
                  usage?.reasoningTokens && usage.reasoningTokens > 0
                    ? usage.reasoningTokens
                    : undefined
                }
              />
              {usage?.costUSD?.totalUSD !== undefined && (
                <>
                  <Separator className="mt-1" />
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-muted-foreground">Total cost</span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="min-w-[4ch] text-right" />
                      <span>
                        {Number.isNaN(
                          Number.parseFloat(usage.costUSD.totalUSD.toString())
                        )
                          ? "—"
                          : `$${Number.parseFloat(usage.costUSD.totalUSD.toString()).toFixed(6)}`}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>

      <AlertDialog
        onOpenChange={setShowCompressDialog}
        open={showCompressDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Compress Chat Context</AlertDialogTitle>
            <AlertDialogDescription>
              This will compress the current chat context to reduce token usage.
              This feature is coming soon.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled>Compress</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ModelSelectorButton({
  selectedModelId,
  onModelChange,
}: {
  selectedModelId: string;
  onModelChange?: (modelId: string) => void;
}) {
  const selectedModel = chatModels.find((model) => model.id === selectedModelId);

  return (
    <PromptInputModelSelect
      onValueChange={(modelName) => {
        const model = chatModels.find((m) => m.name === modelName);
        if (model) {
          onModelChange?.(model.id);
          startTransition(() => {
            saveChatModelAsCookie(model.id);
          });
        }
      }}
      value={selectedModel?.name}
    >
      <Trigger asChild>
        <Button
          className="h-5 px-1.5 text-xs text-muted-foreground hover:text-foreground"
          type="button"
          variant="ghost"
        >
          <CpuIcon size={12} />
          <span className="ml-1 hidden sm:inline text-[10px]">{selectedModel?.name}</span>
        </Button>
      </Trigger>
      <PromptInputModelSelectContent className="min-w-[260px] p-0">
        <div className="flex flex-col gap-px">
          {chatModels.map((model) => (
            <SelectItem key={model.id} value={model.name}>
              <div className="truncate font-medium text-xs">{model.name}</div>
              <div className="mt-px truncate text-[10px] text-muted-foreground leading-tight">
                {model.description}
              </div>
            </SelectItem>
          ))}
        </div>
      </PromptInputModelSelectContent>
    </PromptInputModelSelect>
  );
}

function PersonalizationButton() {
  const [isEnabled, setIsEnabled] = useState(false);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="h-5 px-1.5 text-xs text-muted-foreground hover:text-foreground"
          type="button"
          variant="ghost"
        >
          <SignatureIcon size={12} /> Personalise
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => setIsEnabled(!isEnabled)}
        >
          <span>{isEnabled ? "Disable" : "Enable"} Personalization</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" disabled>
          <span>Customization Settings</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ChatStatusBar({
  usage,
  selectedModelId,
  onModelChange,
}: {
  usage?: AppUsage;
  selectedModelId: string;
  onModelChange?: (modelId: string) => void;
}) {
  return (
    <div className="flex h-5 items-center justify-start gap-1.5 px-2 pb-2 text-xs">
      <ContextUsageButton usage={usage} />
      <ModelSelectorButton
        onModelChange={onModelChange}
        selectedModelId={selectedModelId}
      />
      <PersonalizationButton />
    </div>
  );
}

