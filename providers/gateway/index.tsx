import { gateway } from "@ai-sdk/gateway";
import type { ReactNode } from "react";
import { GatewayProviderClient } from "./client";

type GatewayProviderProps = {
  children: ReactNode;
};

export type ModelsDevData = Record<
  string,
  {
    id: string;
    env: string[];
    npm: string;
    api: string;
    name: string;
    doc: string;
    models: Record<
      string,
      {
        id: string;
        name: string;
        attachment: boolean;
        reasoning: boolean;
        temperature: boolean;
        tool_call: boolean;
        knowledge: string;
        release_date: string;
        last_updated: string;
        modalities: {
          input: string[];
          output: string[];
        };
        open_weights: boolean;
        cost: {
          input: number;
          output: number;
          cache_read: number;
        };
        limit: {
          context: number;
          output: number;
        };
      }
    >;
  }
>;

const getModelData = async () => {
  const response = await fetch("https://models.dev/api.json");

  if (!response.ok) {
    throw new Error("Failed to fetch model data");
  }

  const data = (await response.json()) as ModelsDevData;

  return data;
};

export const GatewayProvider = async ({ children }: GatewayProviderProps) => {
  const { models } = await gateway.getAvailableModels();
  const modelsDevData = await getModelData();

  return (
    <GatewayProviderClient
      models={models.filter(
        (model) => !model.name.toLocaleLowerCase().includes("embed")
      )}
      modelsDevData={modelsDevData}
    >
      {children}
    </GatewayProviderClient>
  );
};
