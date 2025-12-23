"use client";

import type { Session } from "next-auth";
import { startTransition, useMemo, useOptimistic, useState } from "react";
import { saveChatModelAsCookie } from "@/app/(chat)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  COST_CONFIG,
  ENHANCED_MODEL_CATALOG,
  type EnhancedModelInfo,
  PROVIDER_CONFIG,
  SPEED_CONFIG,
} from "@/lib/ai/enhanced-models";
import { entitlementsByUserType } from "@/lib/ai/entitlements";
import { getIconComponent } from "@/lib/ai/icon-utils";
import { chatModels } from "@/lib/ai/models";
import { cn } from "@/lib/utils";
import { CheckCircleFillIcon, ChevronDownIcon } from "./icons";

export function ModelSelector({
  session,
  selectedModelId,
  className,
}: {
  session: Session;
  selectedModelId: string;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const [optimisticModelId, setOptimisticModelId] =
    useOptimistic(selectedModelId);

  const userType = session.user.type;
  const { availableChatModelIds } = entitlementsByUserType[userType];

  const availableChatModels = chatModels.filter((chatModel) =>
    availableChatModelIds.includes(chatModel.id)
  );

  const selectedChatModel = useMemo(
    () =>
      availableChatModels.find(
        (chatModel) => chatModel.id === optimisticModelId
      ),
    [optimisticModelId, availableChatModels]
  );

  // Get enhanced model info
  const getEnhancedInfo = (modelId: string): EnhancedModelInfo | undefined => {
    return ENHANCED_MODEL_CATALOG.find((m) => m.id === modelId);
  };

  const selectedEnhancedInfo = selectedChatModel
    ? getEnhancedInfo(selectedChatModel.id)
    : undefined;

  return (
    <DropdownMenu onOpenChange={setOpen} open={open}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          "w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
          className
        )}
      >
        <Button
          className="gap-2 md:h-[34px] md:px-2"
          data-testid="model-selector"
          variant="outline"
        >
          {selectedEnhancedInfo?.iconType &&
            getIconComponent(selectedEnhancedInfo.iconType, "h-4 w-4")}
          <span className="max-w-[140px] truncate">
            {selectedChatModel?.name}
          </span>
          {selectedEnhancedInfo && (
            <div className="hidden gap-1 sm:flex">
              <Badge
                className={`h-5 px-1.5 text-xs ${SPEED_CONFIG[selectedEnhancedInfo.speed || "medium"].color}`}
                variant="secondary"
              >
                {getIconComponent(
                  SPEED_CONFIG[selectedEnhancedInfo.speed || "medium"].iconType,
                  "h-3 w-3"
                )}
                {selectedEnhancedInfo.speed}
              </Badge>
              <Badge
                className={`h-5 px-1.5 text-xs ${COST_CONFIG[selectedEnhancedInfo.cost || "medium"].color}`}
                variant="secondary"
              >
                {getIconComponent(
                  COST_CONFIG[selectedEnhancedInfo.cost || "medium"].iconType,
                  "h-3 w-3"
                )}
                {selectedEnhancedInfo.cost}
              </Badge>
            </div>
          )}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-[320px] max-w-[90vw] sm:min-w-[420px]"
      >
        <DropdownMenuLabel className="flex items-center gap-2 font-semibold text-sm">
          Select AI Model
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Group by provider */}
        {(["Google", "OpenAI", "Anthropic"] as const).map((provider) => {
          const providerModels = availableChatModels
            .map((cm) => ({
              base: cm,
              enhanced: getEnhancedInfo(cm.id),
            }))
            .filter((m) => m.enhanced?.provider === provider);

          if (providerModels.length === 0) {
            return null;
          }

          return (
            <div key={provider}>
              <DropdownMenuLabel className="flex items-center gap-2 text-muted-foreground text-xs">
                <div
                  className={`h-2 w-2 rounded-full ${PROVIDER_CONFIG[provider].color}`}
                />
                {provider}
              </DropdownMenuLabel>
              {providerModels.map(({ base: chatModel, enhanced }) => {
                const { id } = chatModel;

                return (
                  <DropdownMenuItem
                    asChild
                    data-active={id === optimisticModelId}
                    data-testid={`model-selector-item-${id}`}
                    key={id}
                    onSelect={() => {
                      setOpen(false);

                      startTransition(() => {
                        setOptimisticModelId(id);
                        saveChatModelAsCookie(id);
                      });
                    }}
                  >
                    <button
                      className="group/item flex w-full flex-row items-start justify-between gap-3 p-3 sm:gap-4"
                      type="button"
                    >
                      <div className="flex min-w-0 flex-1 items-start gap-2">
                        {enhanced?.iconType &&
                          getIconComponent(enhanced.iconType, "h-4 w-4")}
                        <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
                          <div className="flex w-full items-center gap-2">
                            <span className="truncate font-medium text-sm sm:text-base">
                              {chatModel.name}
                            </span>
                            <div className="shrink-0 text-foreground opacity-0 group-data-[active=true]/item:opacity-100">
                              <CheckCircleFillIcon />
                            </div>
                          </div>
                          <p className="line-clamp-2 text-muted-foreground text-xs">
                            {chatModel.description}
                          </p>
                          {enhanced && (
                            <div className="mt-0.5 flex flex-wrap gap-1.5">
                              <Badge
                                className={`h-5 px-1.5 text-xs ${SPEED_CONFIG[enhanced.speed || "medium"].color}`}
                                variant="secondary"
                              >
                                {getIconComponent(
                                  SPEED_CONFIG[enhanced.speed || "medium"]
                                    .iconType,
                                  "h-3 w-3"
                                )}
                                {enhanced.speed}
                              </Badge>
                              <Badge
                                className={`h-5 px-1.5 text-xs ${COST_CONFIG[enhanced.cost || "medium"].color}`}
                                variant="secondary"
                              >
                                {getIconComponent(
                                  COST_CONFIG[enhanced.cost || "medium"]
                                    .iconType,
                                  "h-3 w-3"
                                )}
                                ${enhanced.cost}
                              </Badge>
                              {enhanced.contextWindow && (
                                <Badge
                                  className="h-5 px-1.5 text-xs"
                                  variant="outline"
                                >
                                  {(enhanced.contextWindow / 1000).toFixed(0)}k
                                </Badge>
                              )}
                              {enhanced.capabilities?.[0] && (
                                <Badge
                                  className="h-5 px-1.5 text-xs"
                                  variant="outline"
                                >
                                  {enhanced.capabilities[0]}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
