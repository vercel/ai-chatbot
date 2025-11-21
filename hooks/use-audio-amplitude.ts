import { useEffect, useRef, useState } from "react";

/**
 * Hook to extract real-time audio amplitude from a MediaStream (microphone).
 *
 * **Purpose**: Provides visual feedback for Voice Agent mode by analyzing
 * microphone input levels using Web Audio API's AnalyserNode.
 *
 * **Used in**: `components/voice-agent-overlay.tsx`
 *
 * **How it works**:
 * 1. Creates AudioContext and AnalyserNode
 * 2. Connects MediaStream source to analyzer
 * 3. Continuously samples audio data via requestAnimationFrame
 * 4. Calculates RMS (root mean square) amplitude
 * 5. Applies smoothing to prevent jitter
 *
 * @param stream - MediaStream from microphone (from getUserMedia or VAD)
 * @param smoothing - Smoothing factor 0-1 (higher = smoother but slower response)
 * @returns Normalized amplitude value 0-1
 *
 * @example
 * ```tsx
 * const { stream } = useVoiceInput();
 * const amplitude = useMicrophoneAmplitude(stream);
 * <Visualizer amplitude={amplitude} state="listening" />
 * ```
 */
export function useMicrophoneAmplitude(
  stream: MediaStream | null,
  smoothing = 0.8
): number {
  const [amplitude, setAmplitude] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const rafRef = useRef<number | null>(null);
  const smoothedAmpRef = useRef(0);

  useEffect(() => {
    if (!stream) {
      // No stream, reset amplitude
      setAmplitude(0);
      smoothedAmpRef.current = 0;
      return;
    }

    // Create audio context and analyzer
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    dataArrayRef.current = dataArray;

    // Animation loop to update amplitude
    const updateAmplitude = () => {
      if (!analyserRef.current || !dataArrayRef.current) {
        return;
      }

      analyserRef.current.getByteTimeDomainData(dataArrayRef.current);

      // Calculate RMS (root mean square) amplitude
      let sum = 0;
      // biome-ignore lint/style/useForOf: because im lazy
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        const normalized = (dataArrayRef.current[i] - 128) / 128;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / dataArrayRef.current.length);

      // Apply smoothing
      smoothedAmpRef.current =
        smoothing * smoothedAmpRef.current + (1 - smoothing) * rms;

      // Normalize and clamp to 0-1
      // Boost the amplitude more for better visualization
      const normalizedAmp = Math.min(1, smoothedAmpRef.current * 5);
      setAmplitude(normalizedAmp);

      rafRef.current = requestAnimationFrame(updateAmplitude);
    };

    updateAmplitude();

    // Cleanup
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stream, smoothing]);

  return amplitude;
}

/**
 * Hook to extract real-time audio amplitude from HTMLAudioElement (TTS playback).
 *
 * **Purpose**: Provides visual feedback during agent speech by analyzing
 * TTS audio output levels.
 *
 * **Used in**: `components/voice-agent-overlay.tsx`
 *
 * **How it works**:
 * 1. Creates AudioContext and AnalyserNode
 * 2. Connects audio element as source
 * 3. Continuously samples audio data
 * 4. Calculates frequency domain amplitude
 * 5. Returns smoothed amplitude
 *
 * @param audioElement - HTMLAudioElement playing TTS audio
 * @param smoothing - Smoothing factor 0-1
 * @returns Normalized amplitude value 0-1
 *
 * @example
 * ```tsx
 * const audioRef = useRef<HTMLAudioElement>(null);
 * const amplitude = useAudioElementAmplitude(audioRef.current);
 * <Visualizer amplitude={amplitude} state="speaking" />
 * ```
 */
export function useAudioElementAmplitude(
  audioElement: HTMLAudioElement | null,
  smoothing = 0.8
): number {
  const [amplitude, setAmplitude] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const rafRef = useRef<number | null>(null);
  const smoothedAmpRef = useRef(0);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    if (!audioElement) {
      setAmplitude(0);
      smoothedAmpRef.current = 0;
      return;
    }

    // Create audio context and analyzer
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;

    // Create source from audio element
    const source = audioContext.createMediaElementSource(audioElement);
    source.connect(analyser);
    analyser.connect(audioContext.destination); // Must connect to destination for audio to play

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    dataArrayRef.current = dataArray;
    sourceRef.current = source;

    // Animation loop
    const updateAmplitude = () => {
      if (!analyserRef.current || !dataArrayRef.current) {
        return;
      }

      analyserRef.current.getByteFrequencyData(dataArrayRef.current);

      // Calculate average frequency amplitude
      let sum = 0;
      for (const value of dataArrayRef.current) {
        sum += value;
      }
      const average = sum / dataArrayRef.current.length / 255; // Normalize to 0-1

      // Apply smoothing
      smoothedAmpRef.current =
        smoothing * smoothedAmpRef.current + (1 - smoothing) * average;

      setAmplitude(smoothedAmpRef.current);

      rafRef.current = requestAnimationFrame(updateAmplitude);
    };

    updateAmplitude();

    // Cleanup
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [audioElement, smoothing]);

  return amplitude;
}

/**
 * Hook to track audio playback state from player.
 *
 * **Purpose**: Provides playback state for Voice Agent UI to show
 * appropriate visual feedback.
 *
 * @param player - Audio player instance from usePlayer hook
 * @returns Boolean indicating if audio is currently playing
 */
export function useIsPlaying(
  player: {
    isPlaying: boolean;
  } | null
): boolean {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setIsPlaying(player?.isPlaying ?? false);
  }, [player?.isPlaying]);

  return isPlaying;
}
