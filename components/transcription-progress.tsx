'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { WhisperTranscriptionProgressEvent } from '@/lib/knowledge/types/audio';

interface TranscriptionProgressProps {
  documentId: string;
  onCompleted?: (transcript: any) => void;
  pollingInterval?: number;
}

export function TranscriptionProgress({
  documentId,
  onCompleted,
  pollingInterval = 2000 // Check every 2 seconds by default
}: TranscriptionProgressProps) {
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<'processing' | 'completed' | 'failed'>('processing');
  const [message, setMessage] = useState<string>('Transcription in progress...');
  const [error, setError] = useState<string | null>(null);
  const [partialTranscript, setPartialTranscript] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const checkProgress = async () => {
      try {
        const response = await fetch(`/api/knowledge/${documentId}/transcription/progress`);
        
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json() as WhisperTranscriptionProgressEvent;
        
        // Update state based on response
        setStatus(data.status);
        setProgress(data.progress);
        
        if (data.error) {
          setError(data.error);
          setMessage('Transcription failed');
        } else if (data.message) {
          setMessage(data.message);
        }
        
        if (data.text) {
          setPartialTranscript(data.text);
        }
        
        // If completed, stop polling and call onCompleted
        if (data.status === 'completed') {
          if (onCompleted && data.transcript) {
            onCompleted(data.transcript);
          }
          return;
        }
        
        // Continue polling if still processing
        if (data.status === 'processing') {
          setPollCount(c => c + 1);
          timeoutId = setTimeout(checkProgress, pollingInterval);
        }
      } catch (err) {
        console.error('Error checking transcription progress:', err);
        setError('Failed to check transcription progress');
        
        // Keep polling if there was an error, but less frequently
        setPollCount(c => c + 1);
        
        // After 10 failed attempts, slow down polling
        if (pollCount > 10) {
          timeoutId = setTimeout(checkProgress, pollingInterval * 2);
        } else {
          timeoutId = setTimeout(checkProgress, pollingInterval);
        }
      }
    };
    
    // Start polling
    checkProgress();
    
    // Clean up timeout on unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [documentId, pollingInterval, pollCount, onCompleted]);
  
  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center gap-3 mb-2">
        {status === 'processing' && (
          <div className="animate-spin h-5 w-5 border-b-2 border-primary rounded-full"></div>
        )}
        
        {status === 'completed' && (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        )}
        
        {status === 'failed' && (
          <AlertTriangle className="h-5 w-5 text-destructive" />
        )}
        
        <span className="font-medium">{message}</span>
      </div>
      
      {/* Custom progress bar */}
      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-slate-900 dark:bg-slate-50 transition-all"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      {partialTranscript && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-1">
            Partial transcript:
          </h4>
          <div className="bg-slate-50 dark:bg-slate-900 rounded p-3 text-sm">
            {partialTranscript}
          </div>
        </div>
      )}
      
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}