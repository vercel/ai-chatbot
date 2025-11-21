import { useCallback, useRef, useState } from "react";

/**
 * React hook for streaming audio playback using Web Audio API.
 *
 * **Purpose**: Plays streaming PCM audio from Cartesia TTS API with low latency.
 * Handles audio buffering, scheduling, and playback state management.
 *
 * **Used in**:
 * - `components/chat.tsx` - Main chat component for voice output
 * - `components/message-actions.tsx` - TTS playback button on assistant messages
 *
 * **Audio Format Requirements**:
 * - Format: PCM_F32LE (32-bit float, little-endian)
 * - Sample Rate: 24,000 Hz
 * - Channels: 1 (mono)
 * - Source: Cartesia Sonic TTS API streaming response
 *
 * **How It Works**:
 * 1. Creates AudioContext at 24kHz sample rate
 * 2. Reads streaming response chunks (ReadableStream)
 * 3. Converts raw bytes to Float32Array PCM samples
 * 4. Creates AudioBuffers and schedules them for gapless playback
 * 5. Handles leftover bytes between chunks (4-byte alignment for Float32)
 * 6. Calls callback when playback completes
 *
 * **Technical Details**:
 * - Uses Web Audio API's AudioContext and AudioBufferSourceNode
 * - Schedules buffers using precise timing (nextStartTime) for seamless playback
 * - Handles partial data between reads (leftover bytes)
 * - Automatically cleans up AudioContext on stop
 *
 * @returns Object with playback controls:
 *   - isPlaying: Boolean indicating if audio is currently playing
 *   - play(stream, callback): Starts streaming audio playback
 *   - stop(): Stops playback and closes AudioContext
 *
 * @example
 * ```tsx
 * const player = usePlayer();
 *
 * // Play TTS audio
 * const response = await fetch("/api/voice/synthesize", { ... });
 * if (response.body) {
 *   player.play(response.body, () => {
 *     console.log("Playback finished");
 *   });
 * }
 *
 * // Stop playback
 * if (player.isPlaying) {
 *   player.stop();
 * }
 * ```
 *
 * @see app/(chat)/api/voice/synthesize/route.ts - Audio source (Cartesia TTS)
 * @see components/message-actions.tsx - UI trigger for playback
 */
export function usePlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContext = useRef<AudioContext | null>(null);
  const source = useRef<AudioBufferSourceNode | null>(null);

  const stop = useCallback(() => {
    audioContext.current?.close();
    audioContext.current = null;
    setIsPlaying(false);
  }, []);

  const play = useCallback(
    async (stream: ReadableStream, callback: () => void) => {
      stop();
      const context = new AudioContext({ sampleRate: 24_000 });
      audioContext.current = context;

      let nextStartTime = context.currentTime;
      const reader = stream.getReader();
      let leftover = new Uint8Array();
      let result = await reader.read();
      setIsPlaying(true);

      while (!result.done && context) {
        const data = new Uint8Array(leftover.length + result.value.length);
        data.set(leftover);
        data.set(result.value, leftover.length);

        const length = Math.floor(data.length / 4) * 4;
        const remainder = data.length % 4;
        const buffer = new Float32Array(data.buffer, 0, length / 4);

        leftover = new Uint8Array(data.buffer, length, remainder);

        if (buffer.length > 0) {
          const audioBuffer = context.createBuffer(
            1,
            buffer.length,
            context.sampleRate
          );
          audioBuffer.copyToChannel(buffer, 0);

          const sourceNode = context.createBufferSource();
          sourceNode.buffer = audioBuffer;
          sourceNode.connect(context.destination);
          sourceNode.start(nextStartTime);

          nextStartTime += audioBuffer.duration;
          source.current = sourceNode;
        }

        result = await reader.read();
      }

      // Process any remaining leftover bytes at the end
      if (leftover.length >= 4 && context) {
        const length = Math.floor(leftover.length / 4) * 4;
        const buffer = new Float32Array(leftover.buffer, 0, length / 4);

        if (buffer.length > 0) {
          const audioBuffer = context.createBuffer(
            1,
            buffer.length,
            context.sampleRate
          );
          audioBuffer.copyToChannel(buffer, 0);

          const sourceNode = context.createBufferSource();
          sourceNode.buffer = audioBuffer;
          sourceNode.connect(context.destination);
          sourceNode.start(nextStartTime);

          nextStartTime += audioBuffer.duration;
          source.current = sourceNode;
        }
      }

      // Wait for ALL scheduled audio to finish playing
      // Calculate total duration from current time to when last buffer ends
      const totalDuration = nextStartTime - context.currentTime;

      // Schedule cleanup after all audio finishes
      setTimeout(
        () => {
          if (audioContext.current === context) {
            stop();
            callback();
          }
        },
        totalDuration * 1000 + 100
      ); // Add 100ms buffer to be safe
    },
    [stop]
  );

  return {
    isPlaying,
    play,
    stop,
  };
}
