'use client';

import { useEffect, useState } from 'react';
import { AudioRecorder } from '@/components/audio/audio-recorder';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function RecorderPage() {
  const [isClient, setIsClient] = useState(false);

  // Use useEffect to handle client-side only code
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="flex flex-col h-full p-4 md:p-8 pb-20">
      <div className="flex flex-col max-w-4xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-4">Audio Recorder</h1>
        <p className="text-muted-foreground mb-6">
          Record audio directly from your browser and save it to your computer.
        </p>

        {isClient ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>WIZZO Audio Recorder</CardTitle>
              <CardDescription>
                Record high-quality audio and visualize the waveform in real-time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AudioRecorder /> 
            </CardContent>
          </Card>
        ) : (
          <div className="flex items-center justify-center h-40 bg-muted rounded-md">
            <p>Loading recorder...</p>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Recording Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-6 space-y-2">
              <li>You can record both your microphone and system audio simultaneously.</li>
              <li>To record system audio, toggle the "Capture System Audio" switch and select a browser tab.</li>
              <li>Recordings are saved to your default downloads folder.</li>
              <li>For best quality, use a headset or external microphone if available.</li>
              <li>The waveform visualization helps you monitor audio levels in real-time.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
