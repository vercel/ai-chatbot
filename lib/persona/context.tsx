"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type PersonaMode = "owner" | "integrator";

interface PersonaContextValue {
  mode: PersonaMode;
  permissions: string[];
  featureFlags: Record<string, boolean>;
  setMode: (mode: PersonaMode) => void;
  hasPermission: (perm: string) => boolean;
  isEnabled: (flag: string) => boolean;
}

const PersonaContext = createContext<PersonaContextValue | undefined>(undefined);

const PERMISSIONS: Record<PersonaMode, string[]> = {
  owner: ["owner"],
  integrator: ["integrator"],
};

const FLAGS: Record<PersonaMode, Record<string, boolean>> = {
  owner: { wizard: true },
  integrator: { batch: true, advanced: true },
};

export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<PersonaMode>("owner");
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>(FLAGS["owner"]);

  useEffect(() => {
    const storedMode = window.localStorage.getItem("persona-mode") as PersonaMode | null;
    if (storedMode) {
      setMode(storedMode);
      setFeatureFlags(FLAGS[storedMode]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("persona-mode", mode);
    setFeatureFlags(FLAGS[mode]);
  }, [mode]);

  const value: PersonaContextValue = {
    mode,
    permissions: PERMISSIONS[mode],
    featureFlags,
    setMode,
    hasPermission: (perm) => PERMISSIONS[mode].includes(perm),
    isEnabled: (flag) => Boolean(featureFlags[flag]),
  };

  return <PersonaContext.Provider value={value}>{children}</PersonaContext.Provider>;
}

export function usePersona() {
  const ctx = useContext(PersonaContext);
  if (!ctx) throw new Error("usePersona must be used within PersonaProvider");
  return ctx;
}

