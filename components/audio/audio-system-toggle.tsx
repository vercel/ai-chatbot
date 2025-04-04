'use client';

import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Monitor } from 'lucide-react';

interface AudioSystemToggleProps {
  captureSystemAudio: boolean;
  tabSelected: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  onToggle: (checked: boolean) => void;
}

export function AudioSystemToggle({
  captureSystemAudio,
  tabSelected,
  isRecording,
  isProcessing,
  onToggle
}: AudioSystemToggleProps) {
  return (
    <div className="flex items-center justify-start space-x-2 mb-4">
      <Switch
        id="system-audio"
        checked={captureSystemAudio}
        onChange={(e) => onToggle(e.target.checked)}
        disabled={isRecording || isProcessing}
      />
      <Label htmlFor="system-audio" className="cursor-pointer flex items-center gap-1.5">
        <Monitor className="h-4 w-4" />
        Capture System Audio
        {captureSystemAudio && !isRecording && 
          <span className="text-xs text-muted-foreground">(You'll need to select a tab to share)</span>
        }
      </Label>
    </div>
  );
}
