'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { WhisperTranscriptionResponse } from '@/lib/knowledge/types/audio';
import { PlayIcon, PauseIcon } from 'lucide-react';

interface TranscriptViewerProps {
  transcript: WhisperTranscriptionResponse;
  audioUrl?: string;
}

export function TranscriptViewer({
  transcript,
  audioUrl
}: TranscriptViewerProps) {
  const [currentSegment, setCurrentSegment] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Initialize audio player if we have an audio URL
  const initAudio = () => {
    if (!audioUrl || audioRef.current) return;
    
    audioRef.current = new Audio(audioUrl);
    
    // Add event listeners
    audioRef.current.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentSegment(null);
    });
    
    audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
  };
  
  // Handle playback time updates to highlight current segment
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    
    const currentTime = audioRef.current.currentTime;
    
    // Find current segment based on timestamp
    const activeSegment = transcript.segments.findIndex(segment => 
      currentTime >= segment.start && currentTime <= segment.end
    );
    
    if (activeSegment !== -1 && activeSegment !== currentSegment) {
      setCurrentSegment(activeSegment);
      
      // Scroll segment into view if needed
      const segmentElement = document.getElementById(`segment-${activeSegment}`);
      if (segmentElement) {
        segmentElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  };
  
  // Toggle audio playback
  const togglePlayback = () => {
    if (!audioRef.current) {
      initAudio();
    }
    
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };
  
  // Play from a specific segment
  const playSegment = (segmentIndex: number) => {
    if (!audioUrl) return;
    
    if (!audioRef.current) {
      initAudio();
    }
    
    if (!audioRef.current) return;
    
    // Set playback position to segment start
    const segment = transcript.segments[segmentIndex];
    audioRef.current.currentTime = segment.start;
    
    // Start playback
    audioRef.current.play();
    setIsPlaying(true);
    setCurrentSegment(segmentIndex);
  };
  
  // Format seconds into MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="space-y-4">
      {/* Audio player controls (if audio URL is provided) */}
      {audioUrl && (
        <div className="flex items-center space-x-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={togglePlayback}
          >
            {isPlaying ? (
              <PauseIcon className="h-5 w-5" />
            ) : (
              <PlayIcon className="h-5 w-5" />
            )}
          </Button>
          <div className="flex-1">
            <p className="text-sm font-medium">
              {isPlaying 
                ? `Playing segment ${currentSegment !== null ? currentSegment + 1 : ''}`
                : 'Click to play audio'}
            </p>
            <p className="text-xs text-muted-foreground">
              Click on any segment below to jump to that part
            </p>
          </div>
        </div>
      )}
      
      {/* Transcript metadata */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium">Language:</span> {transcript.language || 'English'}
        </p>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium">Segments:</span> {transcript.segments.length}
        </p>
      </div>
      
      {/* Transcript segments */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
        {transcript.segments.map((segment, index) => (
          <div
            key={segment.id}
            id={`segment-${index}`}
            className={`p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border rounded-md ${
              currentSegment === index ? 'bg-primary-50 border-primary dark:bg-primary-900/20' : ''
            }`}
            onClick={() => playSegment(index)}
          >
            <div className="flex items-start gap-2">
              <div className="shrink-0 text-xs text-muted-foreground pt-1 w-16">
                {formatTime(segment.start)}
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground font-medium mb-1">
                  {segment.speaker || 'Speaker'}
                </p>
                <p>{segment.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Full transcript */}
      <div className="mt-8 pt-4 border-t">
        <h3 className="text-lg font-medium mb-2">Full Transcript</h3>
        <div className="bg-slate-50 dark:bg-slate-900 rounded p-4">
          {transcript.text}
        </div>
      </div>
    </div>
  );
}