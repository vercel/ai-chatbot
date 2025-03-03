'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

interface MeetingRoomProps {
  roomUrl?: string;
  onClose: () => void;
  title?: string;
}

export function MeetingRoom({ roomUrl, onClose, title = 'Meeting Room' }: MeetingRoomProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomUrl) {
      setError('No meeting URL provided');
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [roomUrl]);

  // Extract domain and path from roomUrl to ensure it's from Whereby
  const getEmbedUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      
      // Allow only Whereby domains
      if (!urlObj.hostname.includes('whereby.com')) {
        throw new Error('Invalid meeting URL domain');
      }
      
      // Make sure the URL is properly formatted for embedding
      if (urlObj.pathname.startsWith('/v/')) {
        return url;
      } else {
        return `https://${urlObj.hostname}/v/${urlObj.pathname.replace(/^\//, '')}`;
      }
    } catch (e) {
      setError('Invalid meeting URL');
      return null;
    }
  };

  const embedUrl = roomUrl ? getEmbedUrl(roomUrl) : null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg w-full max-w-5xl h-[80vh] flex flex-col shadow-xl">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <XCircle className="h-6 w-6" />
          </Button>
        </div>

        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-6 max-w-md">
                <h3 className="text-lg font-medium text-destructive mb-2">Error Loading Meeting</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={onClose}>Close</Button>
              </div>
            </div>
          )}

          {embedUrl && (
            <iframe
              src={embedUrl}
              allow="camera; microphone; fullscreen; speaker; display-capture"
              className="w-full h-full border-0"
              onLoad={() => setIsLoading(false)}
            ></iframe>
          )}
        </div>
      </div>
    </div>
  );
} 