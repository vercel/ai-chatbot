"use client";

import {
  startTransition,
  useEffect,
  useMemo,
  useOptimistic,
  useState,
} from "react";
import { saveChatModelAsCookie } from "@/app/(chat)/actions";
import { getavailablemodels } from "@/app/actions/models/get";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { entitlementsByUserType } from "@/lib/ai/entitlements";
import type { ChatModel } from "@/lib/ai/models";
import { cn } from "@/lib/utils";
import {
  CheckCircleFillIcon,
  ChevronDownIcon,
  GlobeIcon,
  LockIcon,
  LogoAnthropic,
  LogoGoogle,
  LogoOpenAI,
} from "./icons";

type Session = {
  user: {
    id: string;
    email: string;
    image?: string;
    name?: string;
    type?: string;
  };
};

const ProviderIcon = ({ provider }: { provider: string }) => {
  const p = provider.toLowerCase();
  if (p.startsWith("openai")) {
    return <LogoOpenAI size={14} />;
  }
  if (p.startsWith("anthropic")) {
    return <LogoAnthropic />;
  }
  if (p.startsWith("google")) {
    return <LogoGoogle size={14} />;
  }
  return <GlobeIcon size={14} />;
};

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
  const [chatModels, setChatModels] = useState<ChatModel[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getavailablemodels().then(setChatModels);
  }, []);

  const userType: "guest" | "regular" =
    (session.user.type as "guest" | "regular") || "guest";
  const { availableChatModelIds } = entitlementsByUserType[userType];

  const filteredModels = useMemo(() => {
    if (!search) {
      return chatModels;
    }
    return chatModels.filter((model) =>
      model.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [chatModels, search]);

  const { enabledModels, disabledGroups } = useMemo(() => {
    const enabled: ChatModel[] = [];
    const disabledByProvider: Record<string, ChatModel[]> = {};
    for (const model of filteredModels) {
      const provider = model.id.split("/")[0];
      const isEnabled = availableChatModelIds.includes(model.id);
      if (isEnabled) {
        enabled.push(model);
      } else {
        if (!disabledByProvider[provider]) {
          disabledByProvider[provider] = [];
        }
        disabledByProvider[provider].push(model);
      }
    }
    return { enabledModels: enabled, disabledGroups: disabledByProvider };
  }, [filteredModels, availableChatModelIds]);

  const selectedChatModel = useMemo(
    () => chatModels.find((chatModel) => chatModel.id === optimisticModelId),
    [optimisticModelId, chatModels]
  );

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
          className="md:h-[34px] md:px-2"
          data-testid="model-selector"
          variant="outline"
        >
          {selectedChatModel?.name}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-[520px] min-w-[320px] max-w-[92vw] overflow-hidden sm:min-w-[340px]"
      >
        <div className="sticky top-0 z-10 border-b bg-popover/95 p-2 backdrop-blur supports-backdrop-filter:bg-popover/60">
          <Input
            className="h-8 text-sm"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search models..."
            value={search}
          />
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {enabledModels.length > 0 && (
            <div>
              <div className="px-2 py-1.5 font-medium text-muted-foreground text-xs uppercase">
                free models
              </div>
              {enabledModels.map((chatModel) => {
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
                      className={cn(
                        "group/item flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 hover:bg-accent sm:gap-4"
                      )}
                      type="button"
                    >
                      <div className="flex items-center gap-2">
                        <ProviderIcon provider={id.split("/")[0]} />
                        <div className="flex flex-col items-start gap-1 text-left">
                          <div className="text-sm sm:text-base">
                            {chatModel.name}
                          </div>
                          <div className="line-clamp-1 text-muted-foreground text-xs">
                            {chatModel.description}
                          </div>
                        </div>
                        <Badge className="ml-2" variant="secondary">
                          free
                        </Badge>
                      </div>
                      <div className="text-foreground opacity-0 group-data-[active=true]/item:opacity-100 dark:text-foreground">
                        <CheckCircleFillIcon />
                      </div>
                    </button>
                  </DropdownMenuItem>
                );
              })}
            </div>
          )}

          {Object.entries(disabledGroups).map(([provider, models]) => (
            <div key={provider}>
              <div className="px-2 py-1.5 font-medium text-muted-foreground text-xs uppercase">
                {provider}
              </div>
              {models.map((chatModel) => {
                const { id } = chatModel;
                const isEnabled = false;
                return (
                  <DropdownMenuItem
                    asChild
                    data-active={id === optimisticModelId}
                    data-testid={`model-selector-item-${id}`}
                    disabled
                    key={id}
                    onSelect={(e) => {
                      e.preventDefault();
                    }}
                  >
                    <button
                      className={cn(
                        "group/item flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 sm:gap-4",
                        !isEnabled && "cursor-not-allowed opacity-50"
                      )}
                      disabled
                      type="button"
                    >
                      <div className="flex items-center gap-2 text-left">
                        <ProviderIcon provider={provider} />
                        <div className="flex flex-col items-start gap-1">
                          <div className="text-sm sm:text-base">
                            {chatModel.name}
                          </div>
                          <div className="line-clamp-1 text-muted-foreground text-xs">
                            {chatModel.description}
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <LockIcon size={14} />
                      </div>
                    </button>
                  </DropdownMenuItem>
                );
              })}
            </div>
          ))}

          {enabledModels.length === 0 &&
            Object.keys(disabledGroups).length === 0 && (
              <div className="px-3 py-6 text-center text-muted-foreground text-sm">
                No models found
              </div>
            )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
