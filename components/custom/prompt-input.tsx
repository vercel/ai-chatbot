"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import type { ChatStatus } from "ai";
import { CheckIcon } from "lucide-react";
import { useRef, useState } from "react";
import { saveChatModelAsCookie } from "@/app/(chat)/actions";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import {
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInput as PromptInputComponent,
  PromptInputFooter,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { useGateway } from "@/providers/gateway/client";

type PromptInputProps = {
  status: ChatStatus;
  model: string;
  onModelChange: (model: string) => void;
  sendMessage: UseChatHelpers<never>["sendMessage"];
};

export const PromptInput = ({
  model,
  onModelChange,
  status,
  sendMessage,
}: PromptInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { models } = useGateway();
  const attachments = usePromptInputAttachments();
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);

  const handleSubmit = (message: PromptInputMessage) => sendMessage(message);

  // Group models by their provider
  const modelsByProvider: Record<string, typeof models> = {};

  for (const m of models) {
    const provider = m.specification.provider;
    if (!modelsByProvider[provider]) {
      modelsByProvider[provider] = [];
    }
    modelsByProvider[provider].push(m);
  }

  const [chef] = model.split("/");

  return (
    <PromptInputComponent globalDrop multiple onSubmit={handleSubmit}>
      {attachments.files.length > 0 && (
        <PromptInputHeader>
          <PromptInputAttachments>
            {(attachment) => <PromptInputAttachment data={attachment} />}
          </PromptInputAttachments>
        </PromptInputHeader>
      )}
      <PromptInputBody>
        <PromptInputTextarea ref={textareaRef} />
      </PromptInputBody>
      <PromptInputFooter>
        <PromptInputTools>
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger />
            <PromptInputActionMenuContent>
              <PromptInputActionAddAttachments />
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>
          <ModelSelector
            onOpenChange={setModelSelectorOpen}
            open={modelSelectorOpen}
          >
            <ModelSelectorTrigger asChild>
              <Button
                className="w-[200px] justify-between"
                size="sm"
                variant="ghost"
              >
                {chef && <ModelSelectorLogo provider={chef} />}
                <ModelSelectorName>{model}</ModelSelectorName>
              </Button>
            </ModelSelectorTrigger>
            <ModelSelectorContent>
              <ModelSelectorInput placeholder="Search models..." />
              <ModelSelectorList>
                <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
                {Object.keys(modelsByProvider).map((modelChef) => (
                  <ModelSelectorGroup heading={modelChef} key={modelChef}>
                    {modelsByProvider[modelChef]
                      .filter(
                        (modelItem) =>
                          modelItem.specification.provider === modelChef
                      )
                      .map((modelItem) => (
                        <ModelSelectorItem
                          key={modelItem.id}
                          onSelect={() => {
                            onModelChange(modelItem.id);
                            setModelSelectorOpen(false);
                            saveChatModelAsCookie(modelItem.id);
                          }}
                          value={modelItem.id}
                        >
                          <ModelSelectorLogo
                            provider={modelItem.specification.provider}
                          />
                          <ModelSelectorName>
                            {modelItem.name}
                          </ModelSelectorName>
                          {modelItem.id === model ? (
                            <CheckIcon className="ml-auto size-4" />
                          ) : (
                            <div className="ml-auto size-4" />
                          )}
                        </ModelSelectorItem>
                      ))}
                  </ModelSelectorGroup>
                ))}
              </ModelSelectorList>
            </ModelSelectorContent>
          </ModelSelector>
        </PromptInputTools>
        <PromptInputSubmit status={status} />
      </PromptInputFooter>
    </PromptInputComponent>
  );
};
