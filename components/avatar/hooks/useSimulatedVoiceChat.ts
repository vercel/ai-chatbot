"use client";

import { useState, useCallback, useRef } from "react";

type VoiceState = "idle" | "listening" | "thinking" | "speaking";

interface UseSimulatedVoiceChatReturn {
  state: VoiceState;
  isActive: boolean;
  transcript: string;
  response: string;
  startListening: () => void;
  stopListening: () => void;
  reset: () => void;
}

/**
 * Simulated voice chat hook for demos when HeyGen avatar is not active
 * Provides realistic state transitions and mock interactions
 */
export function useSimulatedVoiceChat(
  onResponse?: (text: string) => void
): UseSimulatedVoiceChatReturn {
  const [state, setState] = useState<VoiceState>("idle");
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const timeoutRef = useRef<NodeJS.Timeout>();

  const mockResponses = [
    "I'd be happy to help you with that. Let me provide some information...",
    "That's a great question! Based on what you've asked, here's what I can tell you...",
    "I understand your concern. Let me explain how this works...",
    "Yes, your coverage includes that benefit. Let me give you the details...",
    "I can help you find the right care option. Here are some suggestions...",
  ];

  const mockTranscripts = [
    "Is my mammogram covered?",
    "How do I find a doctor near me?",
    "What's my copay for urgent care?",
    "Can you help me schedule an appointment?",
    "What preventive care is included in my plan?",
  ];

  const startListening = useCallback(() => {
    setIsActive(true);
    setState("listening");
    setTranscript("");
    setResponse("");

    // Simulate listening duration (1.5-3 seconds)
    const listenDuration = 1500 + Math.random() * 1500;

    timeoutRef.current = setTimeout(() => {
      // Simulate transcript
      const mockTranscript =
        mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
      setTranscript(mockTranscript);
      setState("thinking");

      // Simulate thinking duration (0.8-1.5 seconds)
      const thinkDuration = 800 + Math.random() * 700;

      timeoutRef.current = setTimeout(() => {
        // Simulate response
        const mockResponse =
          mockResponses[Math.floor(Math.random() * mockResponses.length)];
        setResponse(mockResponse);
        setState("speaking");

        // Call optional callback
        onResponse?.(mockResponse);

        // Simulate speaking duration based on response length
        const speakDuration = mockResponse.length * 50; // ~50ms per character

        timeoutRef.current = setTimeout(() => {
          setState("idle");
          setIsActive(false);
        }, speakDuration);
      }, thinkDuration);
    }, listenDuration);
  }, [onResponse]);

  const stopListening = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setState("idle");
    setIsActive(false);
  }, []);

  const reset = useCallback(() => {
    stopListening();
    setTranscript("");
    setResponse("");
  }, [stopListening]);

  return {
    state,
    isActive,
    transcript,
    response,
    startListening,
    stopListening,
    reset,
  };
}
