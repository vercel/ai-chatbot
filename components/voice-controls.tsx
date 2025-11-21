/** biome-ignore-all lint/correctness/noUnusedFunctionParameters: Required for React component props interface */
"use client";

import { Mic, Settings } from "lucide-react";
import { memo, useEffect, useState } from "react";
import type { VadMode } from "@/hooks/use-voice-settings";
import { LoaderIcon } from "./icons";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

/**
 * Props for VoiceControls component.
 *
 * @property vadMode - Current voice detection mode ("always-on" | "push-to-talk")
 * @property setVadMode - Function to change VAD mode
 * @property ttsEnabled - Whether text-to-speech is enabled globally
 * @property setTtsEnabled - Function to toggle TTS on/off
 * @property isRecording - Whether voice is currently being recorded
 * @property isTranscribing - Whether audio is being transcribed (API call in progress)
 * @property onToggleRecording - Callback to start/stop recording (mode-aware)
 * @property status - Current chat status for enabling/disabling controls
 * @property onOpenSettings - Callback to open voice settings modal
 */
type VoiceControlsProps = {
  vadMode: VadMode;
  setVadMode: (mode: VadMode) => void;
  ttsEnabled: boolean;
  setTtsEnabled: (enabled: boolean) => void;
  isRecording: boolean;
  isTranscribing: boolean;
  onToggleRecording: () => void;
  status?: "ready" | "submitted" | "streaming" | "error";
  onOpenSettings?: () => void;
};

/**
 * Voice control buttons component for chat composer.
 *
 * **Purpose**: Provides UI controls for voice input features.
 * Renders microphone button for recording and settings button for voice options.
 *
 * **Used in**: `components/multimodal-input.tsx` - Integrated into chat composer toolbar
 *
 * **Features**:
 * - **Microphone Button**: Toggle voice recording (behavior depends on vadMode)
 *   - PTT mode: Click to start, click to stop
 *   - Visual feedback: Pulsing blue highlight when recording
 *   - Loading spinner during transcription
 *
 * - **Settings Button**: Opens voice settings modal
 *   - Configure TTS (text-to-speech)
 *   - Future: Voice Agent mode configuration
 *
 * **Visual States**:
 * - Recording: Blue pulsing animation on microphone button
 * - Transcribing: Loading spinner replaces microphone icon
 * - Disabled: Grayed out when chat is not ready
 * - Mounted: Prevents hydration mismatch with server-side rendering
 *
 * **Hydration Protection**:
 * Component renders a simplified version (all buttons disabled) until client-side
 * JavaScript loads. This prevents React hydration errors when localStorage values
 * differ from server-rendered defaults.
 *
 * @param props - Voice control configuration and callbacks
 * @returns Rendered voice control buttons with tooltips
 *
 * @see hooks/use-voice-input.ts - Voice recording logic
 * @see hooks/use-voice-settings.ts - Settings persistence
 * @see components/multimodal-input.tsx - Parent component
 */
function PureVoiceControls({
  vadMode,
  setVadMode,
  ttsEnabled,
  setTtsEnabled,
  isRecording,
  isTranscribing,
  onToggleRecording,
  status,
  onOpenSettings,
}: VoiceControlsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isReady = status === "ready" || status === undefined;
  const micDisabled = !isReady || isTranscribing;

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="flex items-center gap-0.5">
        <Button
          className="aspect-square h-8 rounded-lg p-1 transition-colors hover:bg-accent"
          disabled
          type="button"
          variant="ghost"
        >
          <Mic size={14} />
        </Button>
        <Button
          className="aspect-square h-8 rounded-lg p-1 transition-colors hover:bg-accent"
          disabled
          type="button"
          variant="ghost"
        >
          <Settings size={14} />
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className={`aspect-square h-8 rounded-lg p-1 transition-all hover:bg-accent ${
                isRecording
                  ? "animate-pulse bg-blue-500/20 dark:bg-blue-600/20"
                  : ""
              }`}
              data-testid="voice-input-button"
              disabled={micDisabled}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleRecording();
              }}
              type="button"
              variant="ghost"
            >
              {isTranscribing ? (
                <LoaderIcon size={14} />
              ) : (
                <Mic
                  size={14}
                  style={{
                    color: isRecording ? "rgb(59, 130, 246)" : "currentColor",
                  }}
                />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Click to record</p>
            <p className="text-xs opacity-70">Voice transcription</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="aspect-square h-8 rounded-lg p-1 transition-colors hover:bg-accent"
              data-testid="voice-settings-button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpenSettings?.();
              }}
              type="button"
              variant="ghost"
            >
              <Settings size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Voice settings</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

export const VoiceControls = memo(PureVoiceControls);
