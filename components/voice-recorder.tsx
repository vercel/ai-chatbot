import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { MicIcon, StopIcon } from './icons';
import { toast } from 'sonner';
import cx from 'classnames';

// Add TypeScript declarations for the Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
  interpretation: any;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  status: 'idle' | 'recording' | 'transcribing';
  disabled?: boolean;
}

export function VoiceRecorder({ onTranscriptionComplete, status, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout>();
  const audioContextRef = useRef<AudioContext>();
  const analyserRef = useRef<AnalyserNode>();
  const animationFrameRef = useRef<number>();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const drawVisualization = () => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;
    const centerX = WIDTH / 2;
    const centerY = HEIGHT / 2;
    const radius = Math.min(WIDTH, HEIGHT) / 2 - 10;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyserRef.current?.getByteFrequencyData(dataArray);

      canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

      // Draw background circle
      canvasCtx.beginPath();
      canvasCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      canvasCtx.fillStyle = 'rgba(239, 68, 68, 0.1)';
      canvasCtx.fill();

      // Draw waveform
      const barCount = 60;
      const angleStep = (Math.PI * 2) / barCount;
      const barWidth = 2;
      const maxBarHeight = radius * 0.6;

      for (let i = 0; i < barCount; i++) {
        const angle = i * angleStep;
        const dataIndex = Math.floor((i / barCount) * bufferLength);
        const barHeight = (dataArray[dataIndex] / 255) * maxBarHeight;

        const x1 = centerX + Math.cos(angle) * (radius - barHeight);
        const y1 = centerY + Math.sin(angle) * (radius - barHeight);
        const x2 = centerX + Math.cos(angle) * radius;
        const y2 = centerY + Math.sin(angle) * radius;

        canvasCtx.beginPath();
        canvasCtx.moveTo(x1, y1);
        canvasCtx.lineTo(x2, y2);
        canvasCtx.lineWidth = barWidth;
        canvasCtx.strokeStyle = 'rgb(239, 68, 68)';
        canvasCtx.stroke();
      }

      // Draw center circle
      canvasCtx.beginPath();
      canvasCtx.arc(centerX, centerY, radius * 0.3, 0, 2 * Math.PI);
      canvasCtx.fillStyle = 'rgb(239, 68, 68)';
      canvasCtx.fill();
    };

    draw();
  };

  const startRecording = async (event: React.MouseEvent) => {
    event.preventDefault();
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Set up audio visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 2048;
      drawVisualization();

      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current) audioContextRef.current.close();
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.continuous = false;
        recognition.interimResults = false;
        
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          onTranscriptionComplete(transcript);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          toast.error('Error transcribing audio. Please try again.');
          console.error('Speech recognition error:', event.error);
        };

        recognition.start();
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          toast.error('Microphone access denied. Please allow microphone access in your browser settings.', {
            duration: 5000,
            action: {
              label: 'Learn More',
              onClick: () => window.open('https://support.google.com/chrome/answer/2693767', '_blank')
            }
          });
        } else if (error.name === 'NotFoundError') {
          toast.error('No microphone found. Please connect a microphone and try again.');
        } else {
          toast.error('Error accessing microphone. Please try again.');
        }
      }
      console.error('Error accessing microphone:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = (event: React.MouseEvent) => {
    event.preventDefault();
    
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setRecordingTime(0);
    }
  };

  return (
    <div className="relative">
      <Button
        data-testid="voice-recorder-button"
        className={cx(
          "rounded-md rounded-bl-lg p-[7px] h-fit dark:border-zinc-700 hover:dark:bg-zinc-900 hover:bg-zinc-200",
          "transition-all duration-300 ease-in-out transform",
          isRecording && [
            "bg-white dark:bg-zinc-800",
            "ring-2 ring-red-500/50 dark:ring-red-400/30",
            "shadow-lg shadow-red-200/50 dark:shadow-red-900/20"
          ],
          disabled && "opacity-50 cursor-not-allowed scale-95",
          "hover:scale-105 active:scale-95"
        )}
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled || status === 'transcribing'}
        variant="ghost"
        type="button"
      >
        <div className={cx(
          "transition-all duration-300 ease-in-out",
          isRecording ? [
            "scale-110 rotate-0",
            "text-red-500 dark:text-red-400"
          ] : [
            "scale-100",
            "text-gray-600 dark:text-gray-400"
          ]
        )}>
          {isRecording ? <StopIcon size={14} /> : <MicIcon size={14} />}
        </div>
      </Button>
      
      {isRecording && (
        <div 
          className={cx(
            "fixed inset-0 z-50 flex items-center justify-center",
            "bg-black/10 dark:bg-black/30 backdrop-blur-sm"
          )}
        >
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 w-full max-w-xs mx-auto border border-gray-200 dark:border-zinc-700">
            <div className="flex flex-col items-center gap-2">
              <span className="text-base font-semibold text-gray-900 dark:text-gray-100">Recording</span>
              <span className="text-2xl font-mono font-bold text-gray-900 dark:text-gray-100">{formatTime(recordingTime)}</span>
            </div>
            <div className="relative w-40 h-40 flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={200}
                height={200}
                className="w-full h-full"
              />
            </div>
            <Button
              variant="ghost"
              size="lg"
              onClick={stopRecording}
              className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-semibold text-lg"
            >
              Stop Recording
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 