'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MicIcon, StopCircleIcon, TrashIcon, PlayIcon, PauseIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  onCancel: () => void;
  maxDurationSec?: number;
}

export function VoiceRecorder({ 
  onRecordingComplete, 
  onCancel,
  maxDurationSec = 300 // 5 minutes default
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  
  // Set up audio player if we have a recording
  useEffect(() => {
    if (recordedAudio && !audioPlayerRef.current) {
      const audioURL = URL.createObjectURL(recordedAudio);
      audioPlayerRef.current = new Audio(audioURL);
      
      audioPlayerRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
      });
      
      return () => {
        if (audioPlayerRef.current) {
          audioPlayerRef.current.pause();
          URL.revokeObjectURL(audioURL);
        }
      };
    }
  }, [recordedAudio]);
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedAudio(audioBlob);
        
        // Clean up stream tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Set up timer to track duration
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1;
          
          // Stop recording if we hit the max duration
          if (newDuration >= maxDurationSec) {
            stopRecording();
          }
          
          return newDuration;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check your browser permissions.');
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };
  
  const cancelRecording = () => {
    // Stop recording if currently recording
    if (isRecording) {
      stopRecording();
    }
    
    // Clean up audio player if we have a recording
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    
    // Clear recorded audio
    setRecordedAudio(null);
    
    // Notify parent
    onCancel();
  };
  
  const togglePlayback = () => {
    if (!audioPlayerRef.current || !recordedAudio) return;
    
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };
  
  const handleSubmit = () => {
    if (recordedAudio) {
      onRecordingComplete(recordedAudio);
    }
  };
  
  // Format seconds as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="flex flex-col items-center py-6 space-y-8">
      {/* Recording visualization */}
      <div className="relative w-32 h-32 flex items-center justify-center border border-gray-300 rounded-full">
        {isRecording ? (
          <div className="animate-pulse absolute inset-1 rounded-full bg-red-500 opacity-30" />
        ) : null}
        
        <div className={cn(
          "w-24 h-24 rounded-full flex items-center justify-center",
          isRecording ? "bg-red-500 text-white" : "bg-gray-100"
        )}>
          {isRecording ? (
            <div className="text-lg font-semibold">{formatTime(recordingDuration)}</div>
          ) : recordedAudio ? (
            <div className="flex items-center justify-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-16 w-16 rounded-full"
                onClick={togglePlayback}
              >
                {isPlaying ? <PauseIcon size={32} /> : <PlayIcon size={32} />}
              </Button>
            </div>
          ) : (
            <MicIcon className="h-8 w-8 text-gray-500" />
          )}
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex space-x-4">
        {isRecording ? (
          <Button 
            variant="destructive"
            size="lg"
            onClick={stopRecording}
          >
            <StopCircleIcon className="mr-2 h-4 w-4" />
            Stop Recording
          </Button>
        ) : recordedAudio ? (
          <>
            <Button
              variant="outline"
              size="lg"
              onClick={cancelRecording}
            >
              <TrashIcon className="mr-2 h-4 w-4" />
              Discard
            </Button>
            <Button
              variant="default"
              size="lg"
              onClick={handleSubmit}
            >
              Use Recording
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              size="lg"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="lg"
              onClick={startRecording}
            >
              <MicIcon className="mr-2 h-4 w-4" />
              Start Recording
            </Button>
          </>
        )}
      </div>
      
      {/* Info text */}
      {!isRecording && !recordedAudio && (
        <p className="text-sm text-muted-foreground mt-4">
          Record a voice note to add to your knowledge base. Maximum duration: {formatTime(maxDurationSec)}.
        </p>
      )}
      
      {recordedAudio && (
        <p className="text-sm text-muted-foreground mt-4">
          Recording duration: {formatTime(recordingDuration)}
        </p>
      )}
    </div>
  );
}