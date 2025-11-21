"use client";

/**
 * Voice Agent Overlay Component
 *
 * **Purpose**: Floating orb visualization for Voice Agent mode that displays
 * real-time audio feedback during conversations.
 *
 * **Used in**: `components/chat.tsx`
 *
 * **Features**:
 * - Dual visualization: Shows both mic input (listening) and TTS output (speaking)
 * - State-aware colors: Blue (listening), Purple (processing), Green (speaking)
 * - Floating overlay: Appears over composer, messages remain visible
 * - Smooth transitions: Fades between states
 * - Real-time transcription preview
 * - Voice Agent controls: Mute, pause, end session
 *
 * **States**:
 * - idle: Waiting for activation or user input
 * - listening: User speaking, visualizing mic amplitude
 * - processing: Detecting end-of-turn, AI thinking
 * - speaking: Agent responding, visualizing TTS amplitude
 *
 * @see components/Visualizer.tsx - Visual components
 * @see hooks/use-audio-amplitude.ts - Audio analysis
 * @see hooks/use-voice-input.ts - Voice recording
 */

import { Mic, MicOff, Pause, Play, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useMicrophoneAmplitude } from "@/hooks/use-audio-amplitude";
import type { usePlayer } from "@/hooks/use-player";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Visualizer, type VisualizerState } from "./visualizer";

export type VoiceAgentState =
  | "idle" // Waiting
  | "listening" // User speaking
  | "processing" // Detecting EOT / thinking
  | "speaking" // Agent responding
  | "paused"; // Voice agent paused

type VoiceAgentOverlayProps = {
  isActive: boolean;
  onDeactivate: () => void;
  state: VoiceAgentState;
  onStateChange?: (state: VoiceAgentState) => void;
  micStream?: MediaStream | null;
  player?: ReturnType<typeof usePlayer>;
  currentTranscript?: string;
  isMuted?: boolean;
  onToggleMute?: () => void;
};

export function VoiceAgentOverlay({
  isActive,
  onDeactivate,
  state,
  onStateChange,
  micStream,
  currentTranscript,
  isMuted = false,
  onToggleMute,
}: VoiceAgentOverlayProps) {
  const [isPaused, setIsPaused] = useState(false);

  // Get real-time audio amplitudes
  const micAmplitude = useMicrophoneAmplitude(micStream ?? null);
  // TODO: Wire up TTS amplitude when player exposes audio element
  const ttsAmplitude = 0; // useAudioElementAmplitude(player?.audioRef?.current ?? null);

  // Determine which amplitude to use based on state
  const currentAmplitude =
    state === "listening"
      ? micAmplitude
      : state === "speaking"
        ? ttsAmplitude
        : 0;

  // Map voice agent state to visualizer state
  const visualizerState: VisualizerState =
    state === "paused" ? "idle" : state === "idle" ? "idle" : state;

  const handleTogglePause = () => {
    const newPausedState = !isPaused;
    setIsPaused(newPausedState);
    onStateChange?.(newPausedState ? "paused" : "idle");
  };

  // Auto-hide when not active
  useEffect(() => {
    if (!isActive && isPaused) {
      setIsPaused(false);
    }
  }, [isActive, isPaused]);

  if (!isActive) {
    return null;
  }

  return (
    <div className="flex w-full flex-col items-center gap-4 py-6">
      {/* Visualizer Orb - Smaller to fit in composer area */}
      <div className="flex aspect-square w-32 items-center justify-center overflow-hidden rounded-full border border-border bg-muted shadow-lg">
        <Visualizer
          amplitude={currentAmplitude}
          mode="halo"
          state={visualizerState}
        />
      </div>

      {/* State Label and Transcript in horizontal layout */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "h-2 w-2 rounded-full",
              state === "listening" && "animate-pulse bg-blue-400",
              state === "processing" && "animate-pulse bg-purple-400",
              state === "speaking" && "animate-pulse bg-emerald-400",
              (state === "idle" || state === "paused") && "bg-muted-foreground"
            )}
          />
          <span className="font-medium text-sm">
            {state === "listening" && "Listening..."}
            {state === "processing" && "Processing..."}
            {state === "speaking" && "Speaking..."}
            {state === "idle" && "Waiting..."}
            {state === "paused" && "Paused"}
          </span>
        </div>

        {/* Transcript Preview */}
        {currentTranscript && (
          <div className="max-w-lg rounded-lg border border-border bg-muted px-4 py-2 text-center text-muted-foreground text-sm">
            {currentTranscript}
          </div>
        )}
      </div>

      {/* Controls */}
      <TooltipProvider>
        <div className="flex items-center gap-2">
          {/* Mute Toggle */}
          {onToggleMute && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className={cn(
                    "h-9 w-9 rounded-full",
                    isMuted &&
                      "border-destructive/60 bg-destructive/20 text-destructive hover:bg-destructive/30"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleMute();
                  }}
                  size="icon"
                  type="button"
                  variant={isMuted ? "outline" : "outline"}
                >
                  {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isMuted ? "Unmute" : "Mute"} microphone</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Pause/Resume */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="h-9 w-9 rounded-full"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleTogglePause();
                }}
                size="icon"
                type="button"
                variant="outline"
              >
                {isPaused ? <Play size={16} /> : <Pause size={16} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isPaused ? "Resume" : "Pause"} voice agent</p>
            </TooltipContent>
          </Tooltip>

          {/* End Session */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="h-9 w-9 rounded-full border-destructive/60 bg-destructive/20 text-destructive hover:bg-destructive/30"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDeactivate();
                }}
                size="icon"
                type="button"
                variant="outline"
              >
                <X size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>End voice agent session</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* Hint text */}
      <p className="text-center text-muted-foreground text-xs">
        Speak naturally • AI will respond when you finish
      </p>
    </div>
  );
}
