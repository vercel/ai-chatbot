"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";

export type GatewayModel = {
  id: string;
  name: string;
  description?: string;
  modelType: "language" | "embedding";
  specification: {
    provider: string;
    modelId: string;
  };
  pricing?: {
    input: number;
    output: number;
    cachedInputTokens?: number;
    cacheCreationInputTokens?: number;
  };
};

type GatewayContextValue = {
  models: GatewayModel[];
  isLoading: boolean;
  error: Error | null;
};

const GatewayContext = createContext<GatewayContextValue>({
  models: [],
  isLoading: true,
  error: null,
});

export function useGateway() {
  const context = useContext(GatewayContext);
  if (!context) {
    throw new Error("useGateway must be used within a GatewayProvider");
  }
  return context;
}

export function GatewayProvider({ children }: { children: ReactNode }) {
  const [models, setModels] = useState<GatewayModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchModels() {
      try {
        const response = await fetch("/api/models");
        if (!response.ok) {
          throw new Error("Failed to fetch models");
        }
        const data = await response.json();
        setModels(data.models);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    }

    fetchModels();
  }, []);

  return (
    <GatewayContext.Provider value={{ models, isLoading, error }}>
      {children}
    </GatewayContext.Provider>
  );
}
