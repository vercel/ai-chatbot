'use client';

import React from 'react';
import { AudioRecorder as ModularAudioRecorder } from './audio/audio-recorder';

interface AudioRecorderProps {
  className?: string;
}

// This is a simple wrapper component that imports the refactored AudioRecorder
// This maintains backward compatibility with any code that imports from this path
export function AudioRecorder({ className }: AudioRecorderProps) {
  return <ModularAudioRecorder className={className} />;
}
