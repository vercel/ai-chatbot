"use client";

import type { Session } from "next-auth";
import { startTransition, useEffect, useMemo, useOptimistic, useState } from "react";
import useSWR from "swr";
import { saveChatModelAsCookie } from "@/app/(chat)/actions";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  // Fetch models from server to reflect server-side API keys (e.g., STABILITY_API_KEY)
  const fetcher = (url: string) => fetch(url).then((r) => r.json());
  const { data } = useSWR<{ models: Array<{ id: string; name: string; description?: string; provider: string; category?: string }> }>(
    "/api/models",
    fetcher
  );

  // Fallback to empty until server responds
  const serverModels = data?.models ?? [];

  // Apply simple entitlements: guests get basic (exclude experimental), regular gets all
  const availableChatModels = useMemo(() => {
    const list = serverModels;
    if (userType === "guest") {
      return list.filter((m) => !(m.name || "").toLowerCase().includes("experimental"));
    }
    return list;
  }, [serverModels, userType]);

  const grouped = useMemo(() => {
    return {
      general: availableChatModels.filter((m) => (m.category || "general") === "general"),
      image: availableChatModels.filter((m) => m.category === "image"),
      code: availableChatModels.filter((m) => m.category === "code"),
    } as Record<"general" | "image" | "code", typeof availableChatModels>;
  }, [availableChatModels]);

  const selectedChatModel = useMemo(
    () => availableChatModels.find((m) => m.id === optimisticModelId),
    [optimisticModelId, availableChatModels]
  );
  const [activeTab, setActiveTab] = useState<keyof typeof grouped>("general");
  useEffect(() => {
    if (!open) return;
    const category = (selectedChatModel?.category as any) || ("general" as const);
    if (["general", "image", "code"].includes(category)) {
      setActiveTab(category as any);
    } else if ((grouped.image?.length || 0) > 0) {
      setActiveTab("image");
    } else {
      setActiveTab("general");
    }
  }, [open, selectedChatModel?.category, grouped.image?.length]);

  const renderList = (list: typeof availableChatModels) =>
    (list || []).map((chatModel) => {
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
          <button className="group/item flex w-full flex-row items-center justify-between gap-2 sm:gap-4" type="button">
            <div className="flex flex-col items-start gap-1">
              <div className="text-sm sm:text-base">{chatModel.name}</div>
              <div className="line-clamp-2 text-muted-foreground text-xs">{chatModel.description}</div>
            </div>
            <div className="shrink-0 text-foreground opacity-0 group-data-[active=true]/item:opacity-100 dark:text-foreground">
              <CheckCircleFillIcon />
            </div>
          </button>
        </DropdownMenuItem>
      );
    });

  return (
    <DropdownMenu onOpenChange={setOpen} open={open}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          "w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
          className
        )}
      >
        <Button className="md:h-[34px] md:px-2" data-testid="model-selector" variant="outline">
          {selectedChatModel?.name}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[320px] max-w-[90vw] sm:min-w-[420px]">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="m-2">
            <TabsTrigger value="general">Text</TabsTrigger>
            <TabsTrigger value="image">Image</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
          </TabsList>
          <TabsContent value="general" className="px-1 py-1">
            {renderList(grouped.general)}
          </TabsContent>
          <TabsContent value="image" className="px-1 py-1">
            {renderList(grouped.image)}
          </TabsContent>
          <TabsContent value="code" className="px-1 py-1">
            {renderList(grouped.code)}
          </TabsContent>
        </Tabs>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
