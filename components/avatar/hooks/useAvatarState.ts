"use client";

import { useState, useCallback } from "react";

export type AvatarState = "idle" | "listening" | "thinking" | "speaking";

export type AvatarMode = "simulated" | "heygen" | "off";

type UseAvatarStateReturn = {
  // State
  state: AvatarState;
  mode: AvatarMode;
  text?: string;

  // Actions
  setState: (state: AvatarState) => void;
  setMode: (mode: AvatarMode) => void;
  setText: (text?: string) => void;

  // Convenience methods
  startListening: () => void;
  startThinking: () => void;
  startSpeaking: (text?: string) => void;
  reset: () => void;
};

/**
 * Unified hook for managing avatar state across different modes.
 * Handles simulated voice, HeyGen integration, and disabled states.
 */
export function useAvatarState(initialMode: AvatarMode = "simulated"): UseAvatarStateReturn {
  const [state, setState] = useState<AvatarState>("idle");
  const [mode, setMode] = useState<AvatarMode>(initialMode);
  const [text, setText] = useState<string | undefined>(undefined);

  const startListening = useCallback(() => {
    setState("listening");
    setText(undefined);
  }, []);

  const startThinking = useCallback(() => {
    setState("thinking");
    setText(undefined);
  }, []);

  const startSpeaking = useCallback((speakText?: string) => {
    setState("speaking");
    setText(speakText);
  }, []);

  const reset = useCallback(() => {
    setState("idle");
    setText(undefined);
  }, []);

  return {
    state,
    mode,
    text,
    setState,
    setMode,
    setText,
    startListening,
    startThinking,
    startSpeaking,
    reset,
  };
}
