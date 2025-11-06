"use client";

import { useGateway } from "@/providers/gateway/client";
import {
  ModelSelectorCommand,
  ModelSelectorCommandGroup,
  ModelSelectorCommandInput,
  ModelSelectorCommandItem,
  ModelSelectorCommandList,
  ModelSelector as ModelSelectorComponent,
  ModelSelectorContent,
  ModelSelectorHeader,
  ModelSelectorTrigger,
} from "../ai-elements/model-selector";
import { Button } from "../ui/button";

type ModelSelectorProps = {
  model: string;
  onModelChange: (model: string) => void;
};

export const ModelSelector = ({ model, onModelChange }: ModelSelectorProps) => {
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

  return (
    <ModelSelectorComponent>
      <ModelSelectorTrigger asChild>
        <Button className="w-full" size="sm" variant="ghost">
          <div className="flex w-full items-center gap-2 overflow-hidden">
            <span className="block truncate">{model}</span>
          </div>
        </Button>
      </ModelSelectorTrigger>
      <ModelSelectorContent>
        <ModelSelectorHeader />
        <ModelSelectorCommand>
          <ModelSelectorCommandInput />
          <ModelSelectorCommandList>
            {Object.entries(modelsByProvider).map(
              ([provider, providerModels]) => (
                <ModelSelectorCommandGroup heading={provider} key={provider}>
                  {providerModels.map((providerModel) => (
                    <ModelSelectorCommandItem
                      key={providerModel.id}
                      onClick={() => onModelChange(providerModel.id)}
                      value={providerModel.id}
                    >
                      {providerModel.name}
                    </ModelSelectorCommandItem>
                  ))}
                </ModelSelectorCommandGroup>
              )
            )}
          </ModelSelectorCommandList>
        </ModelSelectorCommand>
      </ModelSelectorContent>
    </ModelSelectorComponent>
  );
};
