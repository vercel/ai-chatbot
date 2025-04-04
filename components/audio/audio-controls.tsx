'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Pause, Play, Save, StopCircle, Trash2, Download, FileVideo } from 'lucide-react';

interface AudioControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  audioUrl: string | null;
  isProcessing: boolean;
  permissionDenied: boolean;
  startRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => void;
  saveRecording: () => void;
  saveRecordingAsMP4: () => void;
  discardRecording: () => void;
}

export function AudioControls({
  isRecording,
  isPaused,
  audioUrl,
  isProcessing,
  permissionDenied,
  startRecording,
  pauseRecording,
  resumeRecording,
  stopRecording,
  saveRecording,
  saveRecordingAsMP4,
  discardRecording
}: AudioControlsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-3 mb-4">
      {!isRecording && !audioUrl && (
        <Button 
          onClick={startRecording} 
          disabled={permissionDenied || isProcessing}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          {isProcessing ? (
            <>Processing...</>
          ) : (
            <>
              <Mic className="mr-2 h-4 w-4" />
              Start Recording
            </>
          )}
        </Button>
      )}
      
      {isRecording && !isPaused && (
        <>
          <Button 
            onClick={pauseRecording}
            variant="outline"
            disabled={isProcessing}
          >
            <Pause className="mr-2 h-4 w-4" />
            Pause
          </Button>
          
          <Button 
            onClick={stopRecording}
            variant="secondary"
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : (
              <>
                <StopCircle className="mr-2 h-4 w-4" />
                Stop
              </>
            )}
          </Button>
        </>
      )}
      
      {isRecording && isPaused && (
        <>
          <Button 
            onClick={resumeRecording}
            variant="outline"
            disabled={isProcessing}
          >
            <Play className="mr-2 h-4 w-4" />
            Resume
          </Button>
          
          <Button 
            onClick={stopRecording}
            variant="secondary"
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : (
              <>
                <StopCircle className="mr-2 h-4 w-4" />
                Stop
              </>
            )}
          </Button>
        </>
      )}
      
      {audioUrl && (
        <>
          <Button 
            onClick={saveRecording}
            className="bg-[#2A5B34] hover:bg-[#224428] text-white"
            disabled={isProcessing}
          >
            {isProcessing ? 'Saving...' : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Recording
              </>
            )}
          </Button>

          <Button 
            onClick={saveRecordingAsMP4}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download as MP3
              </>
            )}
          </Button>
          
          <Button 
            onClick={discardRecording}
            variant="outline"
            disabled={isProcessing}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Discard
          </Button>
        </>
      )}
    </div>
  );
}
