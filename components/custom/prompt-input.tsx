"use client";

import type { ChatStatus } from "ai";
import { CheckIcon } from "lucide-react";
import { useRef } from "react";
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
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { useGateway } from "@/providers/gateway/client";

type PromptInputProps = {
  status: ChatStatus;
  model: string;
  onModelChange: (model: string) => void;
};

export const PromptInput = ({
  model,
  onModelChange,
  status,
}: PromptInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    // submit.
  };

  const { models } = useGateway();

  // Group models by their provider
  const modelsByProvider: Record<string, typeof models> = {};

  for (const m of models) {
    const provider = m.specification.provider;
    if (!modelsByProvider[provider]) {
      modelsByProvider[provider] = [];
    }
    modelsByProvider[provider].push(m);
  }

  const [chef, modelId] = model.split("/");

  return (
    <PromptInputProvider>
      <PromptInputComponent globalDrop multiple onSubmit={handleSubmit}>
        <PromptInputHeader>
          <PromptInputAttachments>
            {(attachment) => <PromptInputAttachment data={attachment} />}
          </PromptInputAttachments>
        </PromptInputHeader>
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
            <ModelSelector>
              <ModelSelectorTrigger asChild>
                <Button className="w-[200px] justify-between" variant="outline">
                  {chef && <ModelSelectorLogo provider={chef} />}
                  {modelId && <ModelSelectorName>{modelId}</ModelSelectorName>}
                  <CheckIcon className="ml-2 size-4 shrink-0 opacity-50" />
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
    </PromptInputProvider>
  );
};
