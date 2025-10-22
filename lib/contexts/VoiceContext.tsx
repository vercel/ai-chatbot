"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { useAvatarState, type AvatarState, type AvatarMode } from "@/components/avatar/hooks";

type VoiceContextValue = {
  // State
  state: AvatarState;
  mode: AvatarMode;
  text?: string;
  isListening: boolean;

  // Actions
  startListening: () => void;
  startThinking: () => void;
  startSpeaking: (text?: string) => void;
  reset: () => void;
  setMode: (mode: AvatarMode) => void;
};

const VoiceContext = createContext<VoiceContextValue | undefined>(undefined);

type VoiceProviderProps = {
  children: ReactNode;
  initialMode?: AvatarMode;
};

export function VoiceProvider({
  children,
  initialMode = "simulated",
}: VoiceProviderProps) {
  const avatar = useAvatarState(initialMode);

  return (
    <VoiceContext.Provider
      value={{
        state: avatar.state,
        mode: avatar.mode,
        text: avatar.text,
        isListening: avatar.state === "listening",
        startListening: avatar.startListening,
        startThinking: avatar.startThinking,
        startSpeaking: avatar.startSpeaking,
        reset: avatar.reset,
        setMode: avatar.setMode,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoiceContext() {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error("useVoiceContext must be used within VoiceProvider");
  }
  return context;
}
