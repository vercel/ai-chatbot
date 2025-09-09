'use client';
import { useEffect, useRef, useState } from 'react';

// Declare global types for Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare const SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

interface VoiceInputProps {
  readonly onTranscript: (text: string) => void;
}

export function VoiceInput({ onTranscript }: VoiceInputProps) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognizerRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec: SpeechRecognition = new SpeechRecognition();
      rec.lang = 'pt-BR';
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (e) => {
        const result = Array.from(e.results)
          .map((r) => r[0].transcript)
          .join('');
        onTranscript(result);
      };
      rec.onend = () => setListening(false);
      recognizerRef.current = rec;
      setSupported(true);
    }
  }, [onTranscript]);

  const start = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      recognizerRef.current?.start();
      setListening(true);
    } catch (err) {
      console.error('Microphone permission denied', err);
      setSupported(false);
    }
  };

  const stop = () => {
    recognizerRef.current?.stop();
    setListening(false);
  };

  if (!supported) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={listening ? stop : start}
      aria-label={
        listening ? 'Parar gravação de voz' : 'Iniciar gravação de voz'
      }
      aria-pressed={listening ? 'true' : 'false'}
      className="p-2"
    >
      {listening ? '🛑' : '🎙️'}
    </button>
  );
}
