'use client';
import { useEffect, useRef, useState } from 'react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
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
      aria-pressed={listening}
      className="p-2"
    >
      {listening ? '🛑' : '🎙️'}
    </button>
  );
}
