'use client';

import React from 'react';
import { formatDuration } from '@/lib/utils';

interface AudioPlayerProps {
  audioUrl: string | null;
  audioBlob: Blob | null;
  duration: number;
  captureSystemAudio: boolean;
  hasExternalDevice: boolean;
}

export function AudioPlayer({
  audioUrl,
  audioBlob,
  duration,
  captureSystemAudio,
  hasExternalDevice
}: AudioPlayerProps) {
  if (!audioUrl || !audioBlob) return null;

  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium mb-2">Recording Info</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-semibold">Preview Recording</h4>
          <audio 
            src={audioUrl} 
            controls 
            className="w-full"
            autoPlay
          />
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
          <h4 className="font-semibold">Details</h4>
          <ul className="list-disc pl-4">
            <li>Size: {(audioBlob.size / 1024).toFixed(1)} KB</li>
            <li>Type: {audioBlob.type || 'default browser codec'}</li>
            <li>Duration: {formatDuration(duration)}</li>
            <li>System audio: {captureSystemAudio ? 'Yes' : 'No'}</li>
            <li>External device: {hasExternalDevice ? 'Yes (headphones/mic detected)' : 'No'}</li>
          </ul>
          {hasExternalDevice && (
            <p className="mt-2 text-amber-600 dark:text-amber-400">
              External audio device detected. Adjusted gain levels for optimal quality.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
