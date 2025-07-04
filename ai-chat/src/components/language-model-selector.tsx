"use client";

import { JSX, useMemo, useState } from "react";
import { cn } from "@ai-chat/lib/utils";
import { useCoreContext } from "@ai-chat/app/core-context";
import {
  ChatModeKeyOptions,
  type KnowledgeBase,
  type LanguageModel,
  type KnowledgeBaseKeyOptions,
  type LanguageModelKeyOptions,
} from "@ai-chat/app/api/models";
import { Button } from "./ui/button";
import {
  BotIcon,
  CheckCircleFillIcon,
  ChevronDownIcon,
  MetaIcon,
} from "./icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface LanguageModelInterface extends LanguageModel {
  icon: JSX.Element;
}

interface KnowledgeBaseInterface extends KnowledgeBase {
  icon: JSX.Element;
}

export function LanguageModelSelector({
  className,
  selectedModeId,
}: {
  selectedModeId: ChatModeKeyOptions;
} & React.ComponentProps<typeof Button>) {
  const { knowledgeBases, languageModels } = useCoreContext();
  const models =
    (selectedModeId === ChatModeKeyOptions.Documents
      ? knowledgeBases?.map((kb) => {
          return {
            key: kb.key,
            display_name: kb.display_name,
            description: kb.short_description,
            icon: <MetaIcon />,
          } as KnowledgeBaseInterface;
        })
      : languageModels?.map((lm) => {
          return {
            key: lm.key,
            display_name: lm.display_name,
            description: lm.short_description,
            icon: <BotIcon />,
          } as LanguageModelInterface;
        })) ?? [];
  const [open, setOpen] = useState(false);
  const [currentLanguageModel, setCurrentLanguageModel] = useState<
    LanguageModelKeyOptions | KnowledgeBaseKeyOptions
  >(models[0].key);

  const selectedLanguageModel = useMemo(
    () => models.find((lm) => lm.key === currentLanguageModel),
    [currentLanguageModel]
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          "w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
          className
        )}
      >
        <Button
          data-testid="language-model-selector"
          variant="outline"
          className=" md:flex md:px-2 md:h-[34px]"
        >
          {selectedLanguageModel?.icon}
          {selectedLanguageModel?.display_name}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="min-w-[300px] max-w-[400px]"
      >
        {models.map((model) => (
          <DropdownMenuItem
            data-testid={`language-model-selector-item-${model.key}`}
            key={model.key}
            onSelect={() => {
              setCurrentLanguageModel(model.key);
              setOpen(false);
            }}
            className="gap-4 group/item flex flex-row justify-between items-center"
            data-active={model.key === currentLanguageModel}
          >
            <div className="flex flex-col gap-1 items-start">
              {model.display_name}
              {model.description && (
                <div className="text-xs text-muted-foreground">
                  {model.description}
                </div>
              )}
            </div>
            <div className="text-foreground dark:text-foreground opacity-0 group-data-[active=true]/item:opacity-100">
              <CheckCircleFillIcon />
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
