import { useCallback, useRef, useState } from "react";

/**
 * React hook for client-side Cartesia TTS using WebSocket streaming.
 *
 * **Purpose**: Ultra-low latency TTS by streaming text chunks directly to
 * Cartesia's WebSocket API and playing audio immediately as it arrives.
 *
 * **Used in**:
 * - Voice Agent mode in `components/chat.tsx`
 *
 * **How It Works**:
 * 1. Fetches temporary Cartesia access token from server
 * 2. Opens WebSocket connection to Cartesia
 * 3. Streams text chunks with context_id for prosody continuity
 * 4. Receives audio chunks and plays immediately (Web Audio API)
 * 5. Maintains connection for entire conversation
 *
 * **Benefits vs REST API**:
 * - Ultra-low latency: WebSocket persistent connection
 * - True streaming: Send text chunks, get audio chunks immediately
 * - Context preservation: Maintains prosody across sentences
 * - Efficient: One connection for entire conversation
 * - Multiplexing: Multiple concurrent generations
 *
 * **Audio Format**:
 * - Format: PCM_F32LE (32-bit float, little-endian)
 * - Sample Rate: 24,000 Hz
 * - Channels: 1 (mono)
 *
 * @returns Object with TTS controls:
 *   - isPlaying: Boolean indicating if audio is currently playing
 *   - synthesizeAndPlay(text, callback): Synthesizes text and plays audio
 *   - stop(): Stops current playback and closes WebSocket
 *   - isConnected: Boolean indicating if WebSocket is connected
 *
 * @example
 * ```tsx
 * const cartesiaTTS = useCartesiaTTS();
 *
 * // In voice agent mode, as text chunks arrive:
 * onChunk={(chunk) => {
 *   cartesiaTTS.synthesizeAndPlay(chunk.text, () => {
 *     console.log("Chunk playback finished");
 *   });
 * }}
 * ```
 *
 * @see app/(chat)/api/voice/token/route.ts - Token generation endpoint
 * @see https://docs.cartesia.ai/api-reference/tts/tts - WebSocket API docs
 */
export function useCartesiaTTS() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const isPlayingRef = useRef(false); // Keep a ref for callbacks
  const isPreparingRef = useRef(false); // Track if we're preparing to play (connecting/synthesizing)

  // Helper to update both state and ref
  const updateIsPlaying = useCallback((playing: boolean) => {
    console.log(
      `Cartesia: isPlaying changed: ${isPlayingRef.current} → ${playing} (timestamp=${Date.now()})`
    );
    isPlayingRef.current = playing;
    setIsPlaying(playing);
  }, []);

  const audioContext = useRef<AudioContext | null>(null);
  const websocket = useRef<WebSocket | null>(null);
  const tokenCache = useRef<{ token: string; expiresAt: number } | null>(null);
  const nextStartTime = useRef<number>(0);
  const contextId = useRef<string | null>(null);
  const currentCallback = useRef<(() => void) | null>(null);
  const isFirstChunk = useRef(true);
  const isSynthesizing = useRef(false);
  const activeSourceNodes = useRef<AudioBufferSourceNode[]>([]);

  /**
   * Get a valid Cartesia access token, fetching a new one if needed.
   */
  const getToken = useCallback(async (): Promise<string> => {
    const now = Date.now();

    // Return cached token if still valid (with 5s buffer)
    if (tokenCache.current && tokenCache.current.expiresAt > now + 5000) {
      return tokenCache.current.token;
    }

    // Fetch new token from server
    const response = await fetch("/api/voice/token", {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Failed to get Cartesia token");
    }

    const data = await response.json();
    console.log("Cartesia: Token response:", data);

    if (!data.token) {
      console.error("Cartesia: No token in response!", data);
      throw new Error("Token response missing token field");
    }

    const expiresAt = now + data.expiresIn * 1000;

    tokenCache.current = {
      token: data.token,
      expiresAt,
    };

    console.log("Cartesia: Token fetched, expires in", data.expiresIn, "s");
    console.log("Cartesia: Token length:", data.token.length);
    return data.token;
  }, []);

  /**
   * Connect to Cartesia WebSocket API.
   */
  const connect = useCallback(async () => {
    if (websocket.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    const token = await getToken();

    console.log("Cartesia WebSocket: Connecting to Cartesia...");
    console.log(
      "Cartesia WebSocket: Token:",
      typeof token,
      token ? `length=${token.length}` : "UNDEFINED!"
    );

    if (!token) {
      console.error("Cartesia WebSocket: Token is undefined or null!");
      throw new Error("Cannot connect: token is undefined");
    }

    console.log("Cartesia WebSocket: Token prefix:", token.substring(0, 20));

    // Note: Cartesia WebSocket expects 'access_token' for client-side, 'api_key' for server-side
    const wsUrl = `wss://api.cartesia.ai/tts/websocket?cartesia_version=2024-06-30&access_token=${encodeURIComponent(token)}`;
    console.log(
      "Cartesia WebSocket: Connecting to URL (token hidden):",
      wsUrl.replace(token, "***TOKEN***")
    );

    const ws = new WebSocket(wsUrl);

    ws.binaryType = "arraybuffer";

    ws.onopen = () => {
      console.log("Cartesia WebSocket: Connected successfully!");
      setIsConnected(true);
      // Generate new context ID for this session
      contextId.current = `ctx_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      isFirstChunk.current = true;
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === "chunk" && message.data) {
          // Decode base64 audio data
          const audioData = Uint8Array.from(atob(message.data), (c) =>
            c.charCodeAt(0)
          );

          // Initialize AudioContext on first chunk
          if (!audioContext.current) {
            audioContext.current = new AudioContext({
              sampleRate: 24_000,
            });
            nextStartTime.current = audioContext.current.currentTime;
            console.log(
              "Cartesia WebSocket: AudioContext created, currentTime:",
              audioContext.current.currentTime
            );
          }

          const context = audioContext.current;

          // Ensure nextStartTime is not in the past
          const now = context.currentTime;
          if (nextStartTime.current < now) {
            console.log(
              `Cartesia WebSocket: nextStartTime (${nextStartTime.current.toFixed(3)}) is in the past, resetting to now (${now.toFixed(3)})`
            );
            nextStartTime.current = now;
          }

          // Convert to Float32Array for PCM_F32LE
          const buffer = new Float32Array(
            audioData.buffer,
            audioData.byteOffset,
            audioData.byteLength / 4
          );

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

            // Track active nodes so we can stop them on interrupt
            activeSourceNodes.current.push(sourceNode);
            sourceNode.onended = () => {
              // Remove from active list when done
              activeSourceNodes.current = activeSourceNodes.current.filter(
                (n) => n !== sourceNode
              );
            };

            const scheduleTime = nextStartTime.current;
            sourceNode.start(scheduleTime);

            nextStartTime.current += audioBuffer.duration;

            if (isFirstChunk.current) {
              console.log(
                `Cartesia WebSocket: First audio chunk scheduled at ${scheduleTime.toFixed(3)}s, duration ${audioBuffer.duration.toFixed(3)}s, will end at ${nextStartTime.current.toFixed(3)}s`
              );
              isFirstChunk.current = false;
              // isPlaying already set to true when we sent the message
            }
          }
        } else if (message.type === "done") {
          const context = audioContext.current;
          const endTime = nextStartTime.current;

          if (!context) {
            console.log(
              "Cartesia WebSocket: Generation complete but no AudioContext"
            );
            isSynthesizing.current = false;
            updateIsPlaying(false);
            if (currentCallback.current) {
              currentCallback.current();
              currentCallback.current = null;
            }
            return;
          }

          const now = context.currentTime;
          console.log(
            `Cartesia WebSocket: Generation complete. currentTime=${now.toFixed(3)}s, nextStartTime=${endTime.toFixed(3)}s`
          );

          // Calculate when all audio finishes for THIS generation
          if (endTime > now) {
            const totalDuration = (endTime - now) * 1000;

            console.log(
              `Cartesia WebSocket: Audio will finish in ${totalDuration.toFixed(0)}ms (at ${endTime.toFixed(3)}s)`
            );

            // Wait for audio to FINISH before allowing next synthesis
            setTimeout(() => {
              console.log(
                `Cartesia WebSocket: Audio playback completed at ${context.currentTime.toFixed(3)}s`
              );
              isSynthesizing.current = false; // NOW allow next synthesis

              // Call the callback but DON'T automatically set isPlaying=false
              // Let the callback decide based on whether more text is coming
              if (currentCallback.current) {
                currentCallback.current();
                currentCallback.current = null;
              }

              // NOTE: isPlaying stays true! Chat.tsx will explicitly call
              // a method to set it false when ALL sentences are done
            }, totalDuration + 100);
          } else {
            // No audio to wait for
            console.log(
              `Cartesia WebSocket: No audio to wait for (endTime ${endTime.toFixed(3)} <= now ${now.toFixed(3)})`
            );
            isSynthesizing.current = false;

            if (currentCallback.current) {
              currentCallback.current();
              currentCallback.current = null;
            }

            if (nextStartTime.current <= context.currentTime) {
              updateIsPlaying(false);
            }
          }
        } else if (message.type === "error") {
          console.error("Cartesia WebSocket error:", message);
          updateIsPlaying(false);
        }
      } catch (parseError) {
        console.error("Cartesia WebSocket: Message parsing error:", parseError);
      }
    };

    ws.onerror = (error) => {
      console.error("Cartesia WebSocket error event:", error);
      console.error("WebSocket readyState:", ws.readyState);
      console.error(
        "Common causes: Invalid token, CORS issue, or Cartesia API down"
      );
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log("Cartesia WebSocket: Disconnected");
      setIsConnected(false);
      updateIsPlaying(false);
    };

    websocket.current = ws;

    // Wait for connection to open
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("WebSocket connection timeout"));
      }, 10_000);

      ws.addEventListener("open", () => {
        clearTimeout(timeout);
        // Add small delay to ensure connection is fully ready
        setTimeout(() => resolve(), 100);
      });

      ws.addEventListener("error", () => {
        clearTimeout(timeout);
        reject(new Error("WebSocket connection failed"));
      });
    });
  }, [getToken, updateIsPlaying]);

  /**
   * Stop audio only, keep WebSocket alive (for interrupts).
   */
  const stopAudio = useCallback(() => {
    console.log("Cartesia: Stopping audio (keeping WebSocket alive)");

    // IMMEDIATELY stop all playing audio nodes
    for (const node of activeSourceNodes.current) {
      try {
        node.stop();
        node.disconnect();
      } catch {
        // Node might already be stopped, ignore
      }
    }
    activeSourceNodes.current = [];

    // Close AudioContext
    audioContext.current?.close();
    audioContext.current = null;

    // Reset playback state
    nextStartTime.current = 0;
    currentCallback.current = null;
    isFirstChunk.current = true;
    isSynthesizing.current = false;
    isPreparingRef.current = false;
    updateIsPlaying(false);
  }, [updateIsPlaying]);

  /**
   * Stop audio and close WebSocket (for cleanup/deactivate).
   */
  const stop = useCallback(() => {
    console.log("Cartesia: Stopping ALL audio and closing connection");

    // Stop audio first
    stopAudio();

    // Close WebSocket
    websocket.current?.close();
    websocket.current = null;

    // Reset connection state
    contextId.current = null;
    setIsConnected(false);
  }, [stopAudio]);

  /**
   * Synthesize text to speech using Cartesia WebSocket and play immediately.
   * Can be called multiple times for streaming chunks with prosody continuity.
   *
   * @param text - The text to synthesize
   * @param shouldContinue - Set to true for streaming chunks, false for final chunk
   * @param onComplete - Optional callback when audio playback completes
   */
  const synthesizeAndPlay = useCallback(
    async (text: string, shouldContinue = false, onComplete?: () => void) => {
      try {
        // Ensure WebSocket is connected
        try {
          await connect();
        } catch (connectError) {
          console.error("Cartesia: Connection failed:", connectError);
          throw new Error(`Failed to connect to Cartesia: ${connectError}`);
        }

        // Double-check connection state after connect() completes
        if (
          !websocket.current ||
          websocket.current.readyState !== WebSocket.OPEN
        ) {
          console.error("Cartesia: WebSocket state after connect():", {
            exists: !!websocket.current,
            readyState: websocket.current?.readyState,
            OPEN: WebSocket.OPEN,
          });
          throw new Error("WebSocket not connected after connection attempt");
        }

        console.log(
          `Cartesia WebSocket: Sending text (continue=${shouldContinue}):`,
          text.substring(0, 50)
        );

        // Set isPlaying to true IMMEDIATELY so interrupts are detected
        updateIsPlaying(true);

        // Set callback for THIS generation (only matters for final chunk)
        if (!shouldContinue) {
          currentCallback.current = onComplete || null;
        }

        // Send text chunk to Cartesia
        const message = {
          model_id: "sonic-english",
          transcript: text,
          voice: {
            mode: "id",
            id: "79a125e8-cd45-4c13-8a67-188112f4dd22",
          },
          output_format: {
            container: "raw",
            encoding: "pcm_f32le",
            sample_rate: 24_000,
          },
          language: "en",
          context_id: contextId.current,
          continue: shouldContinue,
        };

        websocket.current.send(JSON.stringify(message));
      } catch (error) {
        console.error("Cartesia WebSocket: Synthesis error:", error);
        updateIsPlaying(false);
        // Don't rethrow - this would crash the voice agent
        // Instead, let it continue and try again on next chunk
      }
    },
    [connect, updateIsPlaying]
  );

  /**
   * Explicitly mark playback as complete.
   * Called by chat.tsx when all sentences are done.
   */
  const markComplete = useCallback(() => {
    console.log("Cartesia: Explicitly marking playback as complete");
    updateIsPlaying(false);
  }, [updateIsPlaying]);

  return {
    isPlaying,
    isPlayingRef, // Export the ref so callbacks can access current value
    isPreparingRef, // Export preparing state so interrupts can detect it
    isSynthesizingRef: isSynthesizing, // Export synthesizing ref too
    isConnected,
    synthesizeAndPlay,
    stop,
    stopAudio, // Stop audio but keep WebSocket (fast interrupts)
    markComplete, // Explicitly mark playback as complete
  };
}
