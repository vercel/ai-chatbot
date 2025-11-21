import { useLocalStorage } from "usehooks-ts";

/**
 * Voice Activity Detection mode.
 *
 * Determines how voice input is triggered in the chat composer.
 *
 * @property "always-on" - Automatically detects speech via VAD (Silero model).
 *   Hands-free operation - just start speaking.
 *
 * @property "push-to-talk" - Manual recording control via button press.
 *   Click to start recording, click again to stop. More reliable, lower overhead.
 */
export type VadMode = "always-on" | "push-to-talk";

/**
 * React hook for managing voice feature settings with localStorage persistence.
 *
 * **Purpose**: Persists user preferences for voice input mode, TTS, and Voice Agent across sessions.
 * Settings are stored in browser localStorage and automatically hydrated on page load.
 *
 * **Used in**:
 * - `components/multimodal-input.tsx` - Chat composer voice controls
 * - `components/chat.tsx` - TTS playback state and Voice Agent mode
 *
 * **Storage Keys**:
 * - `voice-tts-enabled`: Boolean for text-to-speech toggle
 * - `voice-vad-mode`: "always-on" or "push-to-talk" string
 * - `voice-agent-enabled`: Boolean for Voice Agent mode (disabled by default)
 *
 * **Default Values**:
 * - TTS: Disabled (false) - User must opt-in to audio playback
 * - VAD Mode: Push-to-talk - More reliable and predictable
 * - Voice Agent: Disabled (false) - Feature is opt-in
 *
 * @returns Object with settings and setters:
 *   - ttsEnabled: Boolean indicating if TTS is enabled globally
 *   - setTtsEnabled: Function to toggle TTS on/off
 *   - vadMode: Current voice input mode ("always-on" | "push-to-talk")
 *   - setVadMode: Function to switch between VAD modes
 *   - voiceAgentEnabled: Boolean indicating if Voice Agent mode is enabled
 *   - setVoiceAgentEnabled: Function to toggle Voice Agent mode
 *
 * @example
 * ```tsx
 * const { ttsEnabled, setTtsEnabled, voiceAgentEnabled, setVoiceAgentEnabled } = useVoiceSettings();
 *
 * // Toggle Voice Agent
 * <button onClick={() => setVoiceAgentEnabled(!voiceAgentEnabled)}>
 *   {voiceAgentEnabled ? "Disable" : "Enable"} Voice Agent
 * </button>
 * ```
 *
 * @see components/voice-controls.tsx - UI controls for these settings
 * @see hooks/use-voice-input.ts - Consumes vadMode for recording behavior
 * @see components/voice-agent-overlay.tsx - Voice Agent UI
 */
export function useVoiceSettings() {
  const [ttsEnabled, setTtsEnabled] = useLocalStorage(
    "voice-tts-enabled",
    false
  );
  const [vadMode, setVadMode] = useLocalStorage<VadMode>(
    "voice-vad-mode",
    "push-to-talk"
  );
  const [voiceAgentEnabled, setVoiceAgentEnabled] = useLocalStorage(
    "voice-agent-enabled",
    false
  );

  return {
    ttsEnabled,
    setTtsEnabled,
    vadMode,
    setVadMode,
    voiceAgentEnabled,
    setVoiceAgentEnabled,
  };
}
