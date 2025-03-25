// This is a minimal type definition file to support existing imports
// The actual audio functionality has been removed

export interface WhisperTranscriptionResponse {
  text: string;
  segments: Array<{
    id: number;
    start: number;
    end: number;
    text: string;
    speaker?: string;
  }>;
  language: string;
}

export interface WhisperTranscriptionProgressEvent {
  message?: string;
  transcript?: WhisperTranscriptionResponse;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  text?: string;
  error?: string;
}