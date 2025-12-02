"use client";

import { fetchModels } from "tokenlens";
import { getContext, getTokenCosts, getUsage } from "tokenlens/helpers";

declare global {
  interface Window {
    getTokenCosts: typeof getTokenCosts;
    getUsage: typeof getUsage;
    getContext: typeof getContext;
    fetchModels: typeof fetchModels;
  }
}

/**
 * Initialize TokenLens client utilities on the window object
 * This makes TokenLens focused API functions available globally:
 * - getTokenCosts: Get detailed cost breakdown
 * - getUsage: Get usage data with context and cost
 * - getContext: Get context window caps
 * - fetchModels: Fetch model catalog from models.dev
 */
export function initializeTokenLensClient() {
  if (typeof window !== "undefined") {
    window.getTokenCosts = getTokenCosts;
    window.getUsage = getUsage;
    window.getContext = getContext;
    window.fetchModels = fetchModels;
  }
}
