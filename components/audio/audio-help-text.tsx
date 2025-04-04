'use client';

import React from 'react';
import { Mic, Info } from 'lucide-react';

interface AudioHelpTextProps {
  captureSystemAudio: boolean;
  isRecording: boolean;
  audioUrl: string | null;
  tabSelected: boolean;
  hasExternalDevice: boolean;
  permissionDenied: boolean;
}

export function AudioHelpText({
  captureSystemAudio,
  isRecording,
  audioUrl,
  tabSelected,
  hasExternalDevice,
  permissionDenied
}: AudioHelpTextProps) {
  return (
    <>
      {/* Recording help text (always visible unless recording) */}
      {!isRecording && !audioUrl && (
        <div className="mt-4 p-4 border border-muted rounded-md bg-muted/20">
          <h3 className="text-sm font-medium mb-2 flex items-center gap-1.5">
            <Info className="h-4 w-4" />
            Recording Tips
          </h3>
          <ul className="list-disc pl-5 text-sm space-y-1">
            <li>Select your preferred microphone from the dropdown above</li>
            <li>Click <strong>Start Recording</strong> to begin</li>
            <li>The microphone will only be accessed when you start recording</li>
            {permissionDenied && (
              <li className="text-red-600">Please allow microphone access when prompted</li>
            )}
          </ul>
        </div>
      )}

      {/* System audio help text */}
      {captureSystemAudio && !isRecording && !audioUrl && (
        <div className="mt-4 p-4 border border-muted rounded-md bg-muted/20">
          <h3 className="text-sm font-medium mb-2">How to record system audio</h3>
          <ol className="list-decimal pl-5 text-sm space-y-1">
            <li>Toggle "Capture System Audio" to ON</li>
            <li className="font-medium">Click "Start Recording" to begin</li>
            <li className="font-bold text-amber-600 dark:text-amber-400">
              When prompted to select a tab, CHECK "SHARE TAB AUDIO" (IMPORTANT)
            </li>
            <li>Select the browser tab with the audio you want to record</li>
            <li>Click "Share" to start recording both microphone and system audio</li>
          </ol>
          <p className="text-xs text-muted-foreground mt-2">
            This works like screen sharing in Google Meet/Zoom - it can capture audio from any tab, 
            including YouTube, music streaming sites, or any other web content.
          </p>
          {hasExternalDevice && (
            <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900 rounded p-2 bg-amber-50 dark:bg-amber-900/20">
              <p className="font-semibold">Note: Headphones/External Mic Detected</p>
              <p>When using external audio devices like AirPods or headphones, make sure the right device is selected in your system settings.</p>
            </div>
          )}
        </div>
      )}
      
      {/* Permission error message */}
      {permissionDenied && (
        <div className="mt-4 p-4 border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-900 rounded-md text-center">
          <p className="text-red-700 dark:text-red-400">
            Microphone access was denied. Please allow microphone permission in your browser settings and refresh the page.
          </p>
          <p className="mt-2 text-sm text-red-600 dark:text-red-300">
            If you're using external devices like AirPods or headphones, ensure they're properly connected and selected as your default audio device.
          </p>
        </div>
      )}
    </>
  );
}
