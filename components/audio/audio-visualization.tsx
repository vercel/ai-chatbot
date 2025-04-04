'use client';

import React, { useEffect, useRef, useState } from 'react';

interface AudioVisualizationProps {
  isRecording: boolean;
  isPaused: boolean;
  microphoneStream: MediaStream | null;
  systemAudioStream: MediaStream | null;
  captureSystemAudio: boolean;
  audioUrl: string | null;
  canvasHeight?: number;
}

export function AudioVisualization({
  isRecording,
  isPaused,
  microphoneStream,
  systemAudioStream,
  captureSystemAudio,
  audioUrl,
  canvasHeight = 200
}: AudioVisualizationProps) {
  const [canvasInitialized, setCanvasInitialized] = useState(false);
  
  // References
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodesRef = useRef<MediaStreamAudioSourceNode[]>([]);

  // Initialize the canvas when component mounts
  useEffect(() => {
    if (canvasRef.current && !canvasInitialized) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Draw the initial "no signal" state
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw a center line
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        setCanvasInitialized(true);
      }
    }
  }, [canvasInitialized]);

  // Add a useEffect to start/update the preview visualization when streams change
  useEffect(() => {
    if (!isRecording && (microphoneStream || systemAudioStream)) {
      startPreviewVisualization();
    }
    
    return () => {
      // Clean up resources when component unmounts or deps change
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Clean up audio context and nodes
      cleanupAudioResources();
    };
  }, [microphoneStream, systemAudioStream, isRecording]);

  // Start visualization when recording begins
  useEffect(() => {
    if (isRecording && !isPaused) {
      startVisualization();
    } else if (isRecording && isPaused) {
      // Pause visualization
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
    
    return () => {
      // Clean up resources
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isRecording, isPaused]);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      cleanupAudioResources();
    };
  }, []);

  // Preview visualization when system audio or microphone is active but not recording
  const startPreviewVisualization = () => {
    if (!canvasRef.current) return;
    if (isRecording) return; // Don't run preview when actually recording
    
    // Create audio context if it doesn't exist
    if (!audioContextRef.current) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
    }
    
    const audioContext = audioContextRef.current!;
    
    // Create analyser if it doesn't exist
    if (!analyserRef.current) {
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 4096;
      analyserRef.current = analyser;
    }
    
    // Connect streams to analyser
    let hasStream = false;
    
    // Disconnect previous sources
    sourceNodesRef.current.forEach(source => {
      try {
        source.disconnect();
      } catch (error) {
        console.error("Error disconnecting source:", error);
      }
    });
    sourceNodesRef.current = [];
    
    // Connect microphone if available
    if (microphoneStream) {
      const source = audioContext.createMediaStreamSource(microphoneStream);
      source.connect(analyserRef.current);
      sourceNodesRef.current.push(source);
      hasStream = true;
    }
    
    // Connect system audio if available
    if (systemAudioStream) {
      const source = audioContext.createMediaStreamSource(systemAudioStream);
      source.connect(analyserRef.current);
      sourceNodesRef.current.push(source);
      hasStream = true;
    }
    
    if (!hasStream) return;
    
    // Start visualization loop similar to the recording one
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;
    
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      // Stop if we start recording or component unmounts
      if (isRecording || !analyserRef.current) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        return;
      }
      
      animationFrameRef.current = requestAnimationFrame(draw);
      
      // Get waveform data
      analyser.getByteTimeDomainData(dataArray);
      
      // Clear canvas
      canvasCtx.fillStyle = '#f5f5f5';
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add center line
      canvasCtx.beginPath();
      canvasCtx.moveTo(0, canvas.height / 2);
      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.strokeStyle = '#cccccc';
      canvasCtx.lineWidth = 1;
      canvasCtx.stroke();
      
      // Draw waveform (dimmer than when recording)
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = 'rgba(42, 91, 52, 0.6)'; // Dimmer green
      
      canvasCtx.beginPath();
      
      const sliceWidth = canvas.width / bufferLength;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0; // Convert to range -1 to 1
        const y = v * (canvas.height / 2);
        
        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }
        
        x += sliceWidth;
      }
      
      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();
      
      // Add volume indicator
      let volumeSum = 0;
      for (let i = 0; i < bufferLength; i++) {
        volumeSum += Math.abs(dataArray[i] / 128.0 - 1);
      }
      const averageVolume = volumeSum / bufferLength;
      const scaledVolume = Math.min(1, averageVolume * 5);
      
      canvasCtx.fillStyle = 'rgba(42, 91, 52, 0.6)';
      canvasCtx.fillRect(canvas.width - 30, canvas.height - (scaledVolume * canvas.height), 20, scaledVolume * canvas.height);
    };
    
    // Start drawing loop
    console.log("Starting preview visualization");
    draw();
  };

  // Visualization function for waveform during active recording
  const startVisualization = () => {
    if (!canvasRef.current || !analyserRef.current) {
      console.log("Cannot start visualization: canvas or analyser not ready");
      return;
    }
    
    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    
    if (!canvasCtx) {
      console.log("Cannot get canvas context");
      return;
    }
    
    // Increase fftSize for more detailed visualization
    analyser.fftSize = 4096;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      // Only continue if still recording and not paused
      if (!isRecording || isPaused) {
        console.log("Stopping visualization loop: not recording or paused");
        return;
      }
      
      // Request next frame
      animationFrameRef.current = requestAnimationFrame(draw);
      
      // Get waveform data
      analyser.getByteTimeDomainData(dataArray);
      
      // Clear canvas with a light background
      canvasCtx.fillStyle = '#f5f5f5';
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add a center line
      canvasCtx.beginPath();
      canvasCtx.moveTo(0, canvas.height / 2);
      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.strokeStyle = '#cccccc';
      canvasCtx.lineWidth = 1;
      canvasCtx.stroke();
      
      // Style for waveform - make it thicker and more visible
      canvasCtx.lineWidth = 3;
      canvasCtx.strokeStyle = '#2A5B34'; // Match the WIZZO green
      
      // Begin drawing path
      canvasCtx.beginPath();
      
      const sliceWidth = canvas.width / bufferLength;
      let x = 0;
      
      // Draw the waveform
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0; // Convert to range -1 to 1
        const y = v * (canvas.height / 2);
        
        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }
        
        x += sliceWidth;
      }
      
      // Complete the path and stroke
      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();
      
      // Add audio level indicator
      let volumeSum = 0;
      for (let i = 0; i < bufferLength; i++) {
        volumeSum += Math.abs(dataArray[i] / 128.0 - 1);
      }
      const averageVolume = volumeSum / bufferLength;
      const scaledVolume = Math.min(1, averageVolume * 5); // Scale up for visibility
      
      // Draw volume indicator
      canvasCtx.fillStyle = '#2A5B34';
      canvasCtx.fillRect(canvas.width - 30, canvas.height - (scaledVolume * canvas.height), 20, scaledVolume * canvas.height);
    };
    
    // Start the drawing loop
    console.log("Starting visualization loop");
    draw();
  };

  // Function to clean up audio context and resources
  const cleanupAudioResources = () => {
    // Cancel animation frame if active
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Disconnect all source nodes
    sourceNodesRef.current.forEach(source => {
      try {
        source.disconnect();
      } catch (error) {
        console.error("Error disconnecting source:", error);
      }
    });
    sourceNodesRef.current = [];

    // Close audio context if it exists
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (error) {
        console.error("Error closing audio context:", error);
      }
    }
    audioContextRef.current = null;
    analyserRef.current = null;
  };

  return (
    <div className="waveform-container mb-4 bg-muted/20 rounded-md overflow-hidden border border-muted relative">
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={canvasHeight} 
        className="w-full h-full"
      />
      {!isRecording && !audioUrl && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-center px-4">
          {captureSystemAudio 
            ? "Click 'Start Recording' and select a browser tab to share audio from" 
            : "Click 'Start Recording' to begin recording from your microphone"}
        </div>
      )}
    </div>
  );
}
