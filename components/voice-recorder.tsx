import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
// import { MicIcon, CheckIcon } from './icons'; // Make sure CheckIcon is here or from lucide-react
import { toast } from 'sonner';
import cx from 'classnames';
import LoadingPill from './loadingPills';
import { CheckIcon } from 'lucide-react';
import { MicIcon } from './icons';

interface VoiceRecorderProps {
  onVoiceMessage: (audio: Blob) => Promise<void> | void;
  status: 'idle' | 'recording' | 'transcribing';
  disabled?: boolean;
}

export function VoiceRecorder({
  status,
  onVoiceMessage,
  disabled,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext>();
  const analyserRef = useRef<AnalyserNode>();
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRecording) {
      setRecordingTime(0);
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const startRecording = async (event: React.MouseEvent) => {
    event.preventDefault();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          toast.error('Microphone access denied. Please allow access.', {
            duration: 5000,
            action: {
              label: 'Learn More',
              onClick: () =>
                window.open(
                  'https://support.google.com/chrome/answer/2693767',
                  '_blank',
                ),
            },
          });
        } else if (error.name === 'NotFoundError') {
          toast.error('No microphone found.');
        } else {
          toast.error('Error accessing microphone.');
        }
      }
      console.error('Error accessing microphone:', error);
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
    }
    setIsRecording(false);
    audioChunksRef.current = [];
  };

  const sendRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      setIsUploading(true);

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm',
        });

        const result = onVoiceMessage(audioBlob);

        const finalize = () => {
          setIsUploading(false);
          setIsRecording(false); // ✅ Move this here!
          audioChunksRef.current = [];
        };

        if (result instanceof Promise) {
          result.finally(finalize);
        } else {
          finalize();
        }
      };

      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());

      // ❌ Don’t set isRecording to false here
      // setIsRecording(false);
    }
  };

  return (
    <div className="relative flex items-center gap-2">
      {isRecording ? (
        <>
          <button
            type="button"
            onClick={cancelRecording}
            disabled={disabled || isUploading}
          >
            <LoadingPill
              seconds={recordingTime}
              text={isUploading ? 'Uploading...' : undefined}
            />
          </button>

          {!isUploading && (
            <Button
              onClick={sendRecording}
              disabled={disabled}
              variant="ghost"
              className="text-black-600"
              title="Send"
              size="icon"
            >
              <CheckIcon size={16} />
            </Button>
          )}
        </>
      ) : (
        <Button
          data-testid="voice-recorder-button"
          className={cx(
            'rounded-md rounded-bl-lg p-[7px] h-fit dark:border-zinc-700 hover:dark:bg-zinc-900 hover:bg-zinc-200',
            'transition-all duration-300 ease-in-out transform',
            disabled && 'opacity-50 cursor-not-allowed scale-95',
            'hover:scale-105 active:scale-95',
          )}
          onClick={startRecording}
          disabled={disabled || status === 'transcribing'}
          variant="ghost"
          type="button"
        >
          <div className="text-gray-600 dark:text-gray-400">
            <MicIcon size={14} />
          </div>
        </Button>
      )}
    </div>
  );
}
