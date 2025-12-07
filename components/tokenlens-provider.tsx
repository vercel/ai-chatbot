"use client";

import { useEffect } from "react";
import { initializeTokenLensClient } from "@/lib/tokenlens-client";

/**
 * Client component that initializes TokenLens utilities on the window object
 * This should be included in the root layout to make computeCostUSD available globally
 */
export function TokenLensProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initializeTokenLensClient();
  }, []);

  return <>{children}</>;
}
