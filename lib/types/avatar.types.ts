/**
 * Avatar-related types
 */

export type AvatarState = "idle" | "listening" | "thinking" | "speaking";

export type AvatarMode = "simulated" | "heygen" | "off";

export type VoiceState = {
  isActive: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  transcript?: string;
  response?: string;
};

export type AvatarConfig = {
  mode: AvatarMode;
  autoStart?: boolean;
  enableVoice?: boolean;
  avatarId?: string;
  voiceId?: string;
};

export type AvatarCallbacks = {
  onStateChange?: (state: AvatarState) => void;
  onTextChange?: (text?: string) => void;
  onError?: (error: Error) => void;
};
