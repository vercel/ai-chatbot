"use client";

/**
 * Audio Visualizer Components for Voice Agent Mode
 *
 * Provides real-time visual feedback for voice interactions:
 * - Listening (blue): User speaking, visualizes microphone input
 * - Processing (purple): Detecting end-of-turn, AI thinking
 * - Speaking (green/cyan): Agent responding, visualizes TTS output
 * - Waiting (idle): Soft pulse, waiting for user
 *
 * @see components/voice-agent-overlay.tsx - Main voice agent UI
 * @see hooks/use-audio-amplitude.ts - WebAudio amplitude detection
 */

export type VisualizerMode = "pulse" | "halo" | "rings" | "orbit";

export type VisualizerState =
  | "idle" // Waiting, no active audio
  | "listening" // User speaking (mic input)
  | "processing" // Detecting EOT, thinking
  | "speaking"; // Agent speaking (TTS output)

type VisualizerProps = {
  amplitude: number; // 0..1 audio level
  state?: VisualizerState;
};

// Regex patterns for color manipulation (top-level to avoid re-creation)
const ALPHA_REGEX = /[\d.]+\)$/;
const RGBA_ALPHA_REGEX = /[\d.]+\)$/;

const STATE_COLORS = {
  idle: {
    primary: "rgba(129, 140, 248, 0.4)", // Soft indigo
    secondary: "rgba(139, 92, 246, 0.3)", // Soft violet
    glow: "rgba(129, 140, 248, 0.5)",
  },
  listening: {
    primary: "rgba(59, 130, 246, 0.8)", // Blue - user speaking
    secondary: "rgba(96, 165, 250, 0.6)", // Light blue
    glow: "rgba(59, 130, 246, 0.9)",
  },
  processing: {
    primary: "rgba(147, 51, 234, 0.8)", // Purple - thinking
    secondary: "rgba(168, 85, 247, 0.6)", // Light purple
    glow: "rgba(147, 51, 234, 0.9)",
  },
  speaking: {
    primary: "rgba(16, 185, 129, 0.8)", // Green/cyan - agent speaking
    secondary: "rgba(52, 211, 153, 0.6)", // Light emerald
    glow: "rgba(16, 185, 129, 0.9)",
  },
};

function clampAmp(a: number): number {
  return Math.max(0, Math.min(1, a));
}

function PulseOrbVisualizer({ amplitude, state = "idle" }: VisualizerProps) {
  const amp = clampAmp(amplitude);
  const scale = 0.9 + amp * 0.4;
  const glow = 30 + amp * 70;
  const colors = STATE_COLORS[state];

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div
        className="absolute rounded-full opacity-80 blur-3xl transition-all duration-300"
        style={{
          width: "220px",
          height: "220px",
          background: `radial-gradient(circle, ${colors.primary} 0%, transparent 60%)`,
          filter: `drop-shadow(0 0 ${glow}px ${colors.glow})`,
        }}
      />
      <div
        className="rounded-full shadow-2xl transition-all duration-100"
        style={{
          width: `${140 + amp * 40}px`,
          height: `${140 + amp * 40}px`,
          transform: `scale(${scale})`,
          background: `radial-gradient(circle, ${colors.primary}, ${colors.secondary})`,
        }}
      />
    </div>
  );
}

function HaloGlowVisualizer({ amplitude, state = "idle" }: VisualizerProps) {
  const amp = clampAmp(amplitude);
  const glow = 40 + amp * 120;
  const colors = STATE_COLORS[state];

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {/* Outer glow ring */}
      <div
        className="absolute rounded-full border transition-all duration-300"
        style={{
          width: "230px",
          height: "230px",
          borderColor: colors.primary,
          boxShadow: `0 0 ${glow}px ${glow / 4}px ${colors.glow}`,
        }}
      />
      {/* Middle ring */}
      <div
        className="flex items-center justify-center rounded-full border transition-all duration-300 dark:bg-slate-950"
        style={{
          width: "120px",
          height: "120px",
          borderColor: colors.secondary,
          backgroundColor: "rgba(2, 6, 23, 0.9)",
        }}
      >
        {/* Inner core */}
        <div
          className="rounded-full transition-all duration-300"
          style={{
            width: "80px",
            height: "80px",
            background: `radial-gradient(circle, ${colors.primary}, ${colors.secondary})`,
          }}
        />
      </div>
    </div>
  );
}

function RingWaveVisualizer({ amplitude, state = "idle" }: VisualizerProps) {
  const amp = clampAmp(amplitude);
  const base = 110;
  const ringCount = 3;
  const colors = STATE_COLORS[state];

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      {[...new Array(ringCount)].map((_, i) => {
        const t = (i + 1) / ringCount;
        const size = base + t * 90 * (0.6 + amp);
        const alpha = 0.5 - t * 0.22 + amp * 0.15;
        return (
          <div
            className="absolute rounded-full border transition-all duration-300"
            key={`ring-${size.toFixed(1)}-${alpha.toFixed(2)}`}
            style={{
              width: `${size}px`,
              height: `${size}px`,
              borderColor: colors.primary.replace(ALPHA_REGEX, `${alpha})`),
              boxShadow:
                i === ringCount - 1
                  ? `0 0 40px ${colors.glow.replace(RGBA_ALPHA_REGEX, `${0.35 + amp * 0.4})`)}`
                  : undefined,
            }}
          />
        );
      })}
      <div
        className="rounded-full transition-all duration-300"
        style={{
          width: 80,
          height: 80,
          background: `radial-gradient(circle, ${colors.primary}, ${colors.secondary})`,
          boxShadow: `0 0 35px ${colors.glow}`,
        }}
      />
    </div>
  );
}

function OrbitDotsVisualizer({ amplitude, state = "idle" }: VisualizerProps) {
  const amp = clampAmp(amplitude);
  const dotCount = 18;
  const radius = 90 + amp * 20;
  const colors = STATE_COLORS[state];

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div
        className="rounded-full transition-all duration-300"
        style={{
          width: 90,
          height: 90,
          background: `radial-gradient(circle, ${colors.primary}, ${colors.secondary})`,
          boxShadow: `0 0 40px ${colors.glow}`,
        }}
      />
      {[...new Array(dotCount)].map((_, i) => {
        const angle = (i / dotCount) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const scale = 0.6 + (Math.sin(angle * 3 + amp * 4) + 1) * 0.35;
        const size = 6 * scale;
        const alpha = 0.35 + scale * 0.35;

        return (
          <div
            className="absolute rounded-full transition-all duration-200"
            key={`dot-${angle.toFixed(2)}-${x.toFixed(1)}-${y.toFixed(1)}`}
            style={{
              width: size,
              height: size,
              transform: `translate(${x}px, ${y}px)`,
              backgroundColor: colors.primary,
              boxShadow: `0 0 16px ${colors.glow.replace(RGBA_ALPHA_REGEX, `${alpha})`)}`,
              opacity: alpha,
            }}
          />
        );
      })}
    </div>
  );
}

export function Visualizer({
  mode,
  amplitude,
  state = "idle",
}: {
  mode: VisualizerMode;
  amplitude: number;
  state?: VisualizerState;
}) {
  switch (mode) {
    case "pulse":
      return <PulseOrbVisualizer amplitude={amplitude} state={state} />;
    case "halo":
      return <HaloGlowVisualizer amplitude={amplitude} state={state} />;
    case "rings":
      return <RingWaveVisualizer amplitude={amplitude} state={state} />;
    case "orbit":
      return <OrbitDotsVisualizer amplitude={amplitude} state={state} />;
    default:
      return null;
  }
}
