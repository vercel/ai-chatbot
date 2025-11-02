"use client";

import type { GatewayLanguageModelEntry } from "@ai-sdk/gateway";
import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import type { ModelsDevData } from ".";

type GatewayProviderClientProps = {
  children: ReactNode;
  models: GatewayLanguageModelEntry[];
  modelsDevData: ModelsDevData;
};

type GatewayContextType = {
  models: GatewayLanguageModelEntry[];
  modelsDevData: ModelsDevData;
};

const GatewayContext = createContext<GatewayContextType | undefined>(undefined);

export const useGateway = () => {
  const context = useContext(GatewayContext);

  if (!context) {
    throw new Error("useGateway must be used within a GatewayProviderClient");
  }

  return context;
};

export const GatewayProviderClient = ({
  children,
  models,
  modelsDevData,
}: GatewayProviderClientProps) => (
  <GatewayContext.Provider value={{ models, modelsDevData }}>
    {children}
  </GatewayContext.Provider>
);
