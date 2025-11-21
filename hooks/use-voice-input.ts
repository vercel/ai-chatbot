import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { VadMode } from "./use-voice-settings";

/**
 * Options for configuring voice input behavior.
 *
 * @property vadMode - Determines how voice input is triggered (currently only push-to-talk is supported)
 * @property onTranscript - Callback invoked when speech is successfully transcribed
 * @property onStop - Optional callback invoked when recording stops
 */
export type UseVoiceInputOptions = {
  vadMode: VadMode;
  onTranscript: (transcript: string) => void;
  onStop?: () => void;
};

/**
 * React hook for push-to-talk voice input functionality.
 *
 * Uses browser's native MediaRecorder API for reliable audio recording
 * and transcription via Groq's Whisper API.
 *
 * @param options - Configuration object with callbacks
 * @returns Object with recording state and controls
 */
export function useVoiceInput({ onTranscript, onStop }: UseVoiceInputOptions) {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const transcribe = useCallback(
    async (audioBlob: Blob) => {
      setIsTranscribing(true);

      try {
        const formData = new FormData();
        formData.append("audio", audioBlob, "audio.wav");

        const response = await fetch("/api/voice/transcribe", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(error || "Transcription failed");
        }

        const data = await response.json();
        const transcript = data.transcript;

        if (transcript) {
          onTranscript(transcript);
        }
      } catch (error) {
        console.error("Transcription error:", error);
        toast.error("Failed to transcribe audio. Please try again.");
      } finally {
        setIsTranscribing(false);
      }
    },
    [onTranscript]
  );

  // Push-to-talk recording
  const startPushToTalk = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (audioChunksRef.current.length === 0) {
          toast.error("No audio was recorded. Please try again.");
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        // Check if audio blob has content
        if (audioBlob.size === 0) {
          toast.error("Recording was empty. Please speak and try again.");
          return;
        }

        // Groq's Whisper accepts various formats including webm
        transcribe(audioBlob);

        // Stop all tracks
        for (const track of stream.getTracks()) {
          track.stop();
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast.error("Failed to access microphone. Please check permissions.");
    }
  }, [transcribe]);

  const stopPushToTalk = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      onStop?.();
    }
  }, [onStop]);

  // Cleanup: Stop any active recording when component unmounts
  useEffect(() => {
    return () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    };
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopPushToTalk();
    } else {
      startPushToTalk();
    }
  }, [isRecording, startPushToTalk, stopPushToTalk]);

  return {
    isRecording,
    isTranscribing,
    vadState: null, // Kept for compatibility, but no longer used
    startRecording: startPushToTalk,
    stopRecording: stopPushToTalk,
    toggleRecording,
  };
}
