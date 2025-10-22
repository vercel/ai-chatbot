"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type SessionContextType = {
  currentSessionId: string;
  setCurrentSessionId: (id: string) => void;
  createNewSession: () => void;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [currentSessionId, setCurrentSessionId] = useState<string>("1");

  const createNewSession = () => {
    setCurrentSessionId(crypto.randomUUID());
  };

  return (
    <SessionContext.Provider
      value={{
        currentSessionId,
        setCurrentSessionId,
        createNewSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
