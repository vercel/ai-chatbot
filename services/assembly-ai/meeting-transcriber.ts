"use client";

export type CaptureMode = "mic" | "both"; // "both" = mic + tab audio

export type TranscriptSegment = {
  text: string;
  timestamp: string;
  confidence?: number;
  isFinal?: boolean;
};

type StatusHandler = (s: string) => void;
type TranscriptHandler = (s: TranscriptSegment) => void;

/**
 * MeetingTranscriber handles audio capture (mic and optional tab audio),
 * downsampling to 16k PCM16, and realtime streaming to AssemblyAI v3.
 */
export class MeetingTranscriber {
  private SAMPLE_RATE = 16000;
  private captureMode: CaptureMode = "both";
  private micStream: MediaStream | null = null;
  private tabStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private socket: WebSocket | null = null;
  private token: string | null = null;
  private startedAt: number | null = null;
  private onStatusChange: StatusHandler | null = null;
  private onTranscript: TranscriptHandler | null = null;
  private isRecording = false;
  private retryCount = 0;
  private maxRetries = 3;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private pcmBuffer: Float32Array | null = null;

  setCaptureMode(mode: CaptureMode) {
    this.captureMode = mode;
  }

  get isActive() {
    return !!this.startedAt && this.socket?.readyState === WebSocket.OPEN;
  }

  async start(onTranscript: TranscriptHandler, onStatus?: StatusHandler) {
    this.onTranscript = onTranscript;
    this.onStatusChange = onStatus ?? null;
    if (typeof window === "undefined" || !navigator?.mediaDevices) {
      throw new Error(
        "Browser does not support required media APIs. Use a modern browser."
      );
    }
    this.status("Authenticating...");
    this.token = await this.fetchAuthToken();
    this.status("Setting up audio...");
    await this.setupAudioCapture();
    this.status("Connecting to transcription service...");
    await this.setupWebSocket();
    this.startedAt = Date.now();
    this.status("Connected – Listening...");
    this.isRecording = true;
  }

  async stop() {
    this.status("Stopping...");
    this.isRecording = false;
    try {
      this.socket?.send(JSON.stringify({ type: "Terminate" }));
    } catch {}
    this.socket?.close();
    this.socket = null;

    try {
      this.processor?.disconnect();
      await this.audioContext?.close();
    } catch {}
    this.processor = null;
    this.audioContext = null;

    [this.micStream, this.tabStream].forEach((s) =>
      s?.getTracks().forEach((t) => t.stop())
    );
    this.micStream = null;
    this.tabStream = null;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.retryCount = 0;
    this.pcmBuffer = null;

    this.startedAt = null;
    this.status("Stopped");
  }

  // -------- internals --------
  private status(s: string) {
    this.onStatusChange?.(s);
  }

  private async fetchAuthToken(): Promise<string> {
    const res = await fetch("/api/assembly-ai/generate-realtime-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to get token: ${res.status} ${text}`);
    }
    const data = (await res.json()) as { token: string };
    return data.token;
  }

  private async setupAudioCapture() {
    try {
      // Mic stream (if requested)
      if (this.captureMode === "mic" || this.captureMode === "both") {
        this.micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: this.SAMPLE_RATE,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          } as MediaTrackConstraints,
          video: false,
        });
      }

      // Tab audio (only when combined with mic)
      if (this.captureMode === "both") {
        this.status('Select a tab and enable "Share tab audio"');
        const displayStream = (await (navigator.mediaDevices as any).getDisplayMedia({
          audio: {
            // Chrome-specific hints (ignored elsewhere)
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
          video: true,
        })) as MediaStream;
        // Stop video tracks immediately; we only need audio
        displayStream.getVideoTracks().forEach((t) => t.stop());
        const hasAudio = displayStream.getAudioTracks().length > 0;
        if (!hasAudio) {
          // Prompt once more with a clearer message
          this.status(
            'No tab audio detected. Re-select the tab and check "Share tab audio".'
          );
          const retry = (await (navigator.mediaDevices as any).getDisplayMedia({
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
            },
            video: true,
          })) as MediaStream;
          retry.getVideoTracks().forEach((t) => t.stop());
          this.tabStream = retry.getAudioTracks().length > 0 ? retry : null;
        } else {
          this.tabStream = displayStream;
        }

        if (!this.tabStream) {
          this.status("Tab audio not granted; continuing with microphone only");
        }
      }

      // Audio graph
      const Ctx: typeof AudioContext =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new Ctx({ sampleRate: this.SAMPLE_RATE });
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }
      const processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      this.processor = processor;

      const gain = this.audioContext.createGain();
      gain.gain.value = 0; // mute local output to avoid feedback

      const connectIf = (s: MediaStream | null) => {
        if (!s) return;
        const src = this.audioContext!.createMediaStreamSource(s);
        src.connect(processor);
      };
      connectIf(this.micStream);
      connectIf(this.tabStream);

      processor.connect(gain);
      gain.connect(this.audioContext.destination);
    } catch (error: any) {
      if (error?.name === "NotAllowedError") {
        throw new Error(
          "Microphone access denied. Please allow microphone access and try again."
        );
      }
      if (error?.name === "NotFoundError") {
        throw new Error(
          "No microphone found. Please connect a microphone and try again."
        );
      }
      throw error instanceof Error
        ? error
        : new Error("Failed to setup audio capture");
    }
  }

  private async setupWebSocket() {
    const params = new URLSearchParams({
      token: this.token ?? "",
      sample_rate: String(this.SAMPLE_RATE),
      encoding: "pcm_s16le",
      format_turns: "true",
    });
    const url = `wss://streaming.assemblyai.com/v3/ws?${params.toString()}`;
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      // Start streaming audio frames once socket is open
      if (this.processor && this.audioContext) {
        this.processor.onaudioprocess = (event) => {
          const input = event.inputBuffer.getChannelData(0);
          const inRate = this.audioContext!.sampleRate;
          const down = this.downsampleTo16k(input, inRate);
          this.enqueueAndSendPcm16(down);
        };
      }
    };

    let pendingFinal: string | null = null;
    this.socket.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data as string);
        const type = data?.type;
        if (!type || type === "Begin") return;

        if (type === "Turn") {
          const transcript: string = data.transcript || data.text || "";
          if (!transcript) return;
          const end = !!data.end_of_turn;
          const formatted = !!data.turn_is_formatted;
          const confidence: number | undefined =
            typeof data.end_of_turn_confidence === "number"
              ? data.end_of_turn_confidence
              : undefined;

          if (!end) {
            // Interim within a turn
            this.onTranscript?.({
              text: transcript,
              isFinal: false,
              timestamp: new Date().toLocaleTimeString(),
            });
            return;
          }

          // End of turn: prefer emitting only the formatted version to avoid duplicates
          if (formatted) {
            this.onTranscript?.({
              text: transcript,
              isFinal: true,
              confidence,
              timestamp: new Date().toLocaleTimeString(),
            });
            pendingFinal = null;
          } else {
            // Hold unformatted final; wait for formatted variant
            pendingFinal = transcript;
          }
          return;
        }

        if (type === "PartialTranscript" || type === "partial") {
          const text: string = data.text || "";
          if (text) {
            this.onTranscript?.({
              text,
              isFinal: false,
              timestamp: new Date().toLocaleTimeString(),
            });
          }
          return;
        }

        if (type === "Termination") {
          // Server signaled termination
          return;
        }
      } catch {
        // ignore
      }
    };

    this.socket.onerror = () => {
      this.status("Connection error");
    };

    this.socket.onclose = () => {
      if (this.isRecording && this.retryCount < this.maxRetries) {
        this.retryCount++;
        const delay = 1000 * this.retryCount; // simple backoff
        this.status(
          `Connection lost – retry ${this.retryCount}/${this.maxRetries}...`
        );
        this.reconnectTimeout = setTimeout(() => {
          if (this.isRecording) this.attemptReconnect();
        }, delay);
      } else if (this.retryCount >= this.maxRetries) {
        this.status("Connection failed – maximum retries reached");
        this.isRecording = false;
      } else {
        this.status("Stopped");
      }
    };
  }

  private async attemptReconnect() {
    try {
      this.status("Reconnecting...");
      this.token = await this.fetchAuthToken();
      await this.setupWebSocket();
      this.status("Reconnected – Listening...");
    } catch (err) {
      this.status("Reconnection failed");
    }
  }

  private downsampleTo16k(input: Float32Array, inputSampleRate: number) {
    if (inputSampleRate === this.SAMPLE_RATE) return input;
    const ratio = inputSampleRate / this.SAMPLE_RATE;
    const newLength = Math.round(input.length / ratio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetInput = 0;
    while (offsetResult < result.length) {
      const nextOffsetInput = Math.min(
        Math.round((offsetResult + 1) * ratio),
        input.length
      );
      let sum = 0;
      let count = 0;
      for (let i = offsetInput; i < nextOffsetInput; i++) {
        sum += input[i];
        count++;
      }
      result[offsetResult] = count > 0 ? sum / count : 0;
      offsetResult++;
      offsetInput = nextOffsetInput;
    }
    return result;
  }

  private enqueueAndSendPcm16(chunk: Float32Array) {
    const frameSize = 800; // ~50ms at 16kHz

    // Prepend any buffered tail from last callback
    if (this.pcmBuffer && this.pcmBuffer.length) {
      const combined = new Float32Array(this.pcmBuffer.length + chunk.length);
      combined.set(this.pcmBuffer, 0);
      combined.set(chunk, this.pcmBuffer.length);
      chunk = combined;
    }

    let offset = 0;
    while (offset + frameSize <= chunk.length) {
      const frame = chunk.subarray(offset, offset + frameSize);
      const buffer = new ArrayBuffer(frame.length * 2);
      const view = new DataView(buffer);
      for (let j = 0; j < frame.length; j++) {
        let s = Math.max(-1, Math.min(1, frame[j]));
        view.setInt16(j * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      }
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        try {
          this.socket.send(buffer);
        } catch {
          // ignore transient send errors
        }
      }
      offset += frameSize;
    }

    const remaining = chunk.length - offset;
    this.pcmBuffer = remaining > 0 ? chunk.slice(offset) : null;
  }
}
