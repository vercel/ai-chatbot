export interface AudioTranscriptMetadata {
  speakers: number; // Number of detected speakers
  segments: Array<{
    speaker: string; // Speaker identifier (e.g., "SPEAKER_1")
    start: number; // Start time in seconds
    end: number; // End time in seconds
    text: string; // Transcribed text for this segment
  }>;
  processingTime: number; // How long it took to process in seconds
  wordCount: number; // Total number of words in the transcript
  transcriptionModel: string; // Model used (e.g., "whisper-1")
}

export interface WhisperTranscriptionResponse {
  text: string; // The full transcript
  segments: Array<{
    id: number;
    seek: number;
    start: number;
    end: number;
    text: string;
    tokens: number[];
    temperature: number;
    avg_logprob: number;
    compression_ratio: number;
    no_speech_prob: number;
    speaker?: string; // Speaker label if diarization is enabled
  }>;
  language: string;
}

export interface WhisperTranscriptionProgressEvent {
  message?: string;
  transcript?: WhisperTranscriptionResponse;
  status: 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  text?: string; // Current transcript text
  error?: string;
  metadata?: AudioTranscriptMetadata;
}