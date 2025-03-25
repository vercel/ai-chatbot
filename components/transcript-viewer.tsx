'use client';

// This is a simplified placeholder component that replaced the original transcript viewer
// The actual audio functionality has been removed

import { WhisperTranscriptionResponse } from '@/lib/knowledge/types/audio';

interface TranscriptViewerProps {
  transcript: WhisperTranscriptionResponse;
  audioUrl?: string;
}

export function TranscriptViewer({
  transcript,
  audioUrl
}: TranscriptViewerProps) {
  return (
    <div className="space-y-4">
      {/* Simple transcript display */}
      <div className="bg-muted p-4 rounded-md">
        <pre className="whitespace-pre-wrap">{transcript.text}</pre>
      </div>
    </div>
  );
}