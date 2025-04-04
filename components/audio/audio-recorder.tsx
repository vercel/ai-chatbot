'use client';

import React, { useEffect, useRef, useState } from 'react';
import { formatDuration } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { 
  getSystemAudioStream,
  getMicrophoneStream,
  mixAudioStreams,
  getBestSupportedMimeType,
  cleanupAudioResources,
  enumerateAudioDevices,
  testAudioOutput,
  isMP4Blob,
  isMP3Blob,
  convertToMP3,
  convertAudioToFile,
  saveFile
} from '@/lib/audio-utils';

// Import modular components
import { AudioVisualization } from './audio-visualization';
import { AudioControls } from './audio-controls';
import { AudioPlayer } from './audio-player';
import { AudioSystemToggle } from './audio-system-toggle';
import { AudioHelpText } from './audio-help-text';
import { AudioDeviceSelector } from './audio-device-selector';

interface AudioRecorderProps {
  className?: string;
}

export function AudioRecorder({ className }: AudioRecorderProps) {
  // State for recording and audio data
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [canvasInitialized, setCanvasInitialized] = useState(false);
  const [captureSystemAudio, setCaptureSystemAudio] = useState(false);
  const [tabSelected, setTabSelected] = useState(false);
  const [microphoneStream, setMicrophoneStream] = useState<MediaStream | null>(null);
  const [systemAudioStream, setSystemAudioStream] = useState<MediaStream | null>(null);
  const [microphoneVolume, setMicrophoneVolume] = useState(1.0); // Default gain for mic
  const [systemVolume, setSystemVolume] = useState(1.0); // Default gain for system audio
  const [hasExternalDevice, setHasExternalDevice] = useState(false); // Whether external headphone/mic is connected
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(''); // Selected microphone device ID

  // References
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodesRef = useRef<MediaStreamAudioSourceNode[]>([]);
  const gainNodesRef = useRef<GainNode[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const deviceInfoRef = useRef<{inputs: MediaDeviceInfo[], outputs: MediaDeviceInfo[]} | null>(null);

  const { toast } = useToast();

  // Initialize device info for debugging and device selection
  useEffect(() => {
    const getDeviceInfo = async () => {
      if (!deviceInfoRef.current) {
        try {
          const devices = await enumerateAudioDevices();
          deviceInfoRef.current = devices;
          
          // Check if we have headphones or external audio devices
          const externalDevices = devices.inputs.filter(device => 
            device.label.toLowerCase().includes('airpods') ||
            device.label.toLowerCase().includes('headphone') ||
            device.label.toLowerCase().includes('headset') ||
            device.label.toLowerCase().includes('sony')
          );
          
          if (externalDevices.length > 0) {
            console.log('External audio devices detected:', externalDevices.map(d => d.label));
            setHasExternalDevice(true);
            
            // Adjust the mic volume when external devices are detected
            // This helps balance the audio levels when using headphones
            setMicrophoneVolume(1.5); // Increase mic volume slightly
            setSystemVolume(0.8); // Decrease system audio slightly
          }
        } catch (error) {
          console.error('Failed to get audio device info:', error);
        }
      }
    };
    
    getDeviceInfo();
  }, []);

  // Timer for tracking recording duration
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused]);
  
  // Reset tabSelected state when recording starts or stops
  useEffect(() => {
    if (!captureSystemAudio) {
      setTabSelected(false);
    }
  }, [captureSystemAudio]);

  // Remove automatic microphone preview to only request mic access when user clicks record
  useEffect(() => {
    return () => {
      // Clean up microphone stream if component unmounts and we're not recording
      if (!isRecording && microphoneStream && !captureSystemAudio) {
        microphoneStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [captureSystemAudio, isRecording, microphoneStream]);

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      cleanupResources();
    };
  }, []);

  // Cleanup all resources properly
  const cleanupResources = () => {
    console.log("Cleaning up audio recorder resources");
    
    // Cancel any animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Clean up audio resources
    cleanupAudioResources(
      mediaStreamRef.current, 
      audioContextRef.current, 
      sourceNodesRef.current,
      gainNodesRef.current
    );
    
    // Clean up additional streams
    if (microphoneStream) {
      microphoneStream.getTracks().forEach(track => track.stop());
      setMicrophoneStream(null);
    }
    
    if (systemAudioStream) {
      systemAudioStream.getTracks().forEach(track => track.stop());
      setSystemAudioStream(null);
    }
    
    // Clean up audio URL
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    
    // Reset media recorder and streams
    mediaRecorderRef.current = null;
    mediaStreamRef.current = null;
    sourceNodesRef.current = [];
    
    // Reset processing state
    setIsProcessing(false);
  };

  // Function to handle system audio toggle
  const handleSystemAudioToggle = (checked: boolean) => {
    // Simply update state without requesting system audio yet
    setCaptureSystemAudio(checked);
    
    // If turning off system audio, clean up any existing stream
    if (!checked && systemAudioStream) {
      console.log("Stopping system audio stream");
      systemAudioStream.getTracks().forEach(track => track.stop());
      setSystemAudioStream(null);
      setTabSelected(false);
    }
  };
  
  // Start recording function with improved error handling
  const startRecording = async () => {
    try {
      console.log("Starting recording process");
      setIsProcessing(true);
      
      // Clean up any previous recording
      try {
        cleanupResources();
        
        // Reset states
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
          setAudioUrl(null);
        }
        setAudioBlob(null);
        setDuration(0);
        audioChunksRef.current = [];
        
        // Get device information to adjust settings for headphones/etc
        if (!deviceInfoRef.current) {
          deviceInfoRef.current = await enumerateAudioDevices().catch(() => ({ inputs: [], outputs: [] }));
        }
        
        // Get microphone audio with selected device
        console.log("Requesting microphone access...");
        const micStream = await getMicrophoneStream({
          preferredDeviceId: selectedDeviceId,
          useDefaultDevice: !selectedDeviceId
        });
        if (!micStream) {
          setIsProcessing(false);
          setPermissionDenied(true);
          toast({
            title: "Microphone Access Denied",
            description: "Please grant microphone permission to use the audio recorder.",
            variant: "destructive"
          });
          return;
        }
        
        console.log("Microphone access granted with tracks:", micStream.getAudioTracks().length);
        
        // Check if we're getting audio from the microphone
        console.log("Testing microphone audio...");
        const micHasAudio = await testAudioOutput(micStream).catch(() => true); // Assume audio works if test fails
        if (!micHasAudio) {
          console.warn("No audio detected from microphone");
          toast({
            title: "Microphone Warning",
            description: "No sound detected from microphone. Please check your microphone settings.",
            variant: "destructive"
          });
        }
        
        setMicrophoneStream(micStream);
        
        // Ensure microphone volume is high enough to be heard
        setMicrophoneVolume(Math.max(microphoneVolume, 1.5));
        // Lower system audio volume to avoid drowning out the microphone
        if (captureSystemAudio) {
          setSystemVolume(Math.min(systemVolume, 0.8));
        }
        
        // Collect streams to use (always include microphone)
        const streamsToMix: MediaStream[] = [];
        
        // Always add microphone first (position is important for proper identification in mixAudioStreams)
        streamsToMix.push(micStream);
        
        // Use existing system audio stream if available
        if (captureSystemAudio && systemAudioStream) {
          // Test if the system audio stream is still valid (not ended)
          const systemAudioActive = systemAudioStream.getAudioTracks().some(track => 
            track.readyState === 'live' && !track.muted
          );
          
          if (systemAudioActive) {
            console.log("Using existing system audio stream");
            streamsToMix.push(systemAudioStream);
          } else {
            console.warn("Existing system audio stream is inactive, requesting new one");
            // Clean up old stream
            systemAudioStream.getTracks().forEach(track => track.stop());
            setSystemAudioStream(null);
            
            // Try to get a new stream if system audio is still requested
            if (captureSystemAudio) {
              console.log("Requesting new system audio stream...");
              
              toast({
                title: "System Audio",
                description: "Please select a tab to capture audio from.",
              });
              
              const newSysStream = await getSystemAudioStream();
              if (newSysStream) {
                streamsToMix.push(newSysStream);
                setSystemAudioStream(newSysStream);
                setTabSelected(true);
              } else {
                console.warn("Could not get new system audio stream");
                toast({
                  title: "System Audio Unavailable",
                  description: "Could not access system audio. Recording with microphone only.",
                  variant: "destructive"
                });
                setCaptureSystemAudio(false);
                setTabSelected(false);
              }
            }
          }
        } 
        // If system audio is enabled but no stream available, try to get it
        else if (captureSystemAudio && !systemAudioStream) {
          console.log("Requesting new system audio stream for recording");
          
          toast({
            title: "System Audio",
            description: "Please select a tab to capture audio from.",
          });
          
          const sysStream = await getSystemAudioStream();
          if (sysStream) {
            streamsToMix.push(sysStream);
            setSystemAudioStream(sysStream);
            setTabSelected(true);
            
            // Test the stream to ensure it has audio
            testAudioOutput(sysStream).then(hasAudio => {
              if (!hasAudio && isRecording) {
                toast({
                  title: "System Audio Warning",
                  description: "System audio is being recorded, but no sound was detected. Make sure audio is playing in the selected tab.",
                  variant: "destructive"
                });
              }
            }).catch(() => {}); // Ignore test failures
          } else {
            console.warn("Could not get system audio stream for recording");
            toast({
              title: "System Audio Unavailable",
              description: "Could not capture system audio. Recording with microphone only.",
              variant: "destructive"
            });
            setCaptureSystemAudio(false);
          }
        }
        
        // Log the streams we're going to mix
        console.log(`Setting up recording with ${streamsToMix.length} streams:`);
        streamsToMix.forEach((stream, i) => {
          const tracks = stream.getAudioTracks();
          console.log(`Stream ${i + 1}: ${tracks.length} tracks, label: ${tracks[0]?.label || 'unknown'}`);
        });
        
        // Set up audio context and stream
        let finalStream: MediaStream;
        
        if (streamsToMix.length > 1) {
          // Mix multiple streams with gain control
          const { stream, context, analyser, sources, gainNodes } = mixAudioStreams(
            streamsToMix,
            {
              micGain: microphoneVolume,      // Use the mic volume setting
              systemGain: systemVolume        // Use the system volume setting
            }
          );
          finalStream = stream;
          audioContextRef.current = context;
          analyserRef.current = analyser;
          sourceNodesRef.current = sources;
          gainNodesRef.current = gainNodes;
          
          // Make sure the audio context is running
          if (context.state === 'suspended') {
            await context.resume();
          }
        } else {
          // Just use the microphone stream
          finalStream = micStream;
          
          // Create a direct copy of the microphone stream for recording
          // This ensures we're using the raw microphone input without any processing
          const microphoneTrack = micStream.getAudioTracks()[0];
          finalStream = new MediaStream([microphoneTrack.clone()]);
          
          // Still create an AudioContext for visualization only
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          audioContextRef.current = audioContext;
          
          // Resume the audio context if it's suspended (needed for Safari)
          if (audioContext.state === 'suspended') {
            await audioContext.resume();
          }
          
          // Set up analyzer for visualization
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 4096; // Increased for better detail
          analyserRef.current = analyser;
          
          // Create source from stream and connect to analyzer
          const source = audioContext.createMediaStreamSource(finalStream);
          sourceNodesRef.current = [source];
          source.connect(analyser);
        }
        
        mediaStreamRef.current = finalStream;
        
        // Check that we actually have audio tracks in the final stream
        const finalAudioTracks = finalStream.getAudioTracks();
        console.log(`Creating MediaRecorder with finalStream tracks: ${finalStream.getTracks().length}, audio tracks: ${finalAudioTracks.length}`);
        finalAudioTracks.forEach((track, i) => {
          console.log(`Final audio track ${i+1}: ${track.label}, readyState: ${track.readyState}, kind: ${track.kind}`);
        });
        
        if (finalAudioTracks.length === 0) {
          throw new Error("No audio tracks in final stream");
        }
        
        // Get best supported MIME type
        const mimeType = getBestSupportedMimeType();
        console.log("Using MIME type:", mimeType || "default browser codec");
        
        // Create MediaRecorder with options
        const recorderOptions: MediaRecorderOptions = {
          audioBitsPerSecond: 128000 // Higher quality audio (128kbps)
        };
        
        // Add mime type if we found a supported one
        if (mimeType) {
          recorderOptions.mimeType = mimeType;
        }
        
        const recorder = new MediaRecorder(finalStream, recorderOptions);
        mediaRecorderRef.current = recorder;
        console.log("Created MediaRecorder");
        
        // Handle data available event
        recorder.ondataavailable = (event) => {
          console.log("Data available event, size:", event.data.size);
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        // Handle recording stop event
        recorder.onstop = () => {
          console.log("MediaRecorder stopped, chunks:", audioChunksRef.current.length);
          
          if (audioChunksRef.current.length === 0) {
            console.log("No audio chunks recorded!");
            toast({
              title: "Recording Error",
              description: "No audio data was captured. Please try again.",
              variant: "destructive"
            });
            setIsProcessing(false);
            return;
          }
          
          // Use the same mime type for the blob as we used for recording
          const blobOptions = {
            type: mimeType || 'audio/webm'
          };
          
          const audioData = new Blob(audioChunksRef.current, blobOptions);
          console.log("Created audio blob, size:", audioData.size, "type:", audioData.type);
          
          setAudioBlob(audioData);
          const url = URL.createObjectURL(audioData);
          setAudioUrl(url);
          console.log("Created audio URL:", url);
          
          toast({
            title: "Recording Complete",
            description: `Recorded ${formatDuration(duration)} of audio` + 
                        (captureSystemAudio ? " with system audio." : "."),
          });
          
          setIsProcessing(false);
        };

        // Log any recorder errors
        recorder.onerror = (event) => {
          console.error("MediaRecorder error:", event);
          toast({
            title: "Recording Error",
            description: "An error occurred while recording",
            variant: "destructive"
          });
          setIsProcessing(false);
        };

        // Start recording with frequent chunks for better responsiveness
        console.log("Starting MediaRecorder");
        recorder.start(250); // Collect data in chunks of 250ms
        console.log("Started recording");
        
        setIsRecording(true);
        setIsPaused(false);
        
        toast({
          title: "Recording Started",
          description: captureSystemAudio 
            ? "Recording microphone and system audio" 
            : "Recording microphone audio",
        });
        
        setIsProcessing(false);
      } catch (error) {
        console.error('Error during recording setup:', error);
        toast({
          title: "Recording Setup Error",
          description: `Could not set up recording properly: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive"
        });
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      
      toast({
        title: "Recording Error",
        description: `Could not start recording: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
      
      // Clean up any partially initialized resources
      cleanupResources();
    }
  };

  // Pause recording function
  const pauseRecording = () => {
    console.log("Pausing recording");
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      try {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        
        toast({
          title: "Recording Paused",
          description: "Recording has been paused",
        });
      } catch (error) {
        console.error("Error pausing recording:", error);
        toast({
          title: "Error",
          description: "Could not pause recording",
          variant: "destructive"
        });
      }
    }
  };

  // Resume recording function
  const resumeRecording = () => {
    console.log("Resuming recording");
    if (mediaRecorderRef.current && isRecording && isPaused) {
      try {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        
        toast({
          title: "Recording Resumed",
          description: "Recording has been resumed",
        });
      } catch (error) {
        console.error("Error resuming recording:", error);
        toast({
          title: "Error",
          description: "Could not resume recording",
          variant: "destructive"
        });
      }
    }
  };

  // Stop recording function
  const stopRecording = () => {
    console.log("Stopping recording");
    setIsProcessing(true);
    
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        setIsPaused(false);
        
        // Stop will trigger the onstop handler which will handle the rest
      } catch (error) {
        console.error("Error stopping recording:", error);
        toast({
          title: "Error",
          description: "Could not stop recording properly",
          variant: "destructive"
        });
        setIsProcessing(false);
      }
    } else {
      setIsProcessing(false);
    }
  };

  // Save recording function
  const saveRecording = async () => {
    console.log("Saving recording");
    if (!audioBlob) {
      console.log("No audio blob to save");
      toast({
        title: "Error",
        description: "No recording available to save",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsProcessing(true);
      
      // Get current datetime for filename
      const date = new Date();
      const formattedDate = date.toISOString().replace(/:/g, '-').replace(/\.+/, '');
      
      // Set the file extension based on the MIME type
      let extension = 'webm';
      if (audioBlob.type.includes('mp4')) {
        extension = 'mp4';
      }
      
      const fileName = `WIZZO_Recording_${formattedDate}.${extension}`;
      
      console.log("Saving file:", fileName, "Type:", audioBlob.type, "Size:", audioBlob.size);
      
      // Create a download link
      const a = document.createElement('a');
      a.href = audioUrl!;
      a.download = fileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // Small delay before removing the element to ensure download starts
      setTimeout(() => {
        document.body.removeChild(a);
        setIsProcessing(false);
        
        toast({
          title: "Recording Saved",
          description: `Saved as ${fileName} in your downloads folder`,
        });
      }, 100);
      
    } catch (error) {
      console.error('Error saving recording:', error);
      toast({
        title: "Error",
        description: "Failed to save recording",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };
  
  // Save recording as MP3 function
  const saveRecordingAsMP4 = async () => {
    console.log("Saving recording as MP3");
    if (!audioBlob) {
      console.log("No audio blob to save");
      toast({
        title: "Error",
        description: "No recording available to save",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsProcessing(true);
      
      // Get current datetime for filename
      const date = new Date();
      const formattedDate = date.toISOString().replace(/:/g, '-').replace(/\.+/, '');
      const fileName = `WIZZO_Recording_${formattedDate}.mp3`;
      
      // If already MP3, save directly
      if (isMP3Blob(audioBlob)) {
        console.log("Audio is already in MP3 format, saving directly");
        saveFile(fileName, audioBlob);
        
        setIsProcessing(false);
        toast({
          title: "Recording Saved as MP3",
          description: `Saved as ${fileName} in your downloads folder`,
        });
        return;
      }
      
      toast({
        title: "Converting to MP3",
        description: "Please wait while we convert your recording to MP3 format...",
      });
      
      console.log("Converting to MP3 format...");
      
      try {
        // First try using the full MP3 conversion (may fail in some browsers)
        const mp3Blob = await convertToMP3(audioBlob, 44100, 128).catch(error => {
          console.log("Primary MP3 conversion failed, using fallback method", error);
          throw error; // Force fallback
        });
        console.log("MP3 conversion successful, size:", mp3Blob.size);
        saveFile(fileName, mp3Blob);
        
        toast({
          title: "Recording Saved as MP3",
          description: `Saved as ${fileName} in your downloads folder`,
        });
      } catch (conversionError) {
        // Use fallback conversion if MP3 encoding fails
        console.log("Using fallback WAV conversion...");
        // Convert to WAV instead as a fallback
        const wavBlob = await convertAudioToFile(audioBlob, 'wav');
        const wavFileName = fileName.replace(".mp3", ".wav");
        saveFile(wavFileName, wavBlob);
        
        toast({
          title: "Saved as WAV instead",
          description: `MP3 conversion failed, saved as ${wavFileName} instead`,
        });
      }
      
      setIsProcessing(false);
      
    } catch (error) {
      console.error('Error saving recording as MP3:', error);
      
      // Final fallback - just save the original format with MP3 extension
      try {
        const date = new Date();
        const formattedDate = date.toISOString().replace(/:/g, '-').replace(/\.+/, '');
        const fileName = `WIZZO_Recording_${formattedDate}.mp3`;
        
        // Just change the MIME type without actual conversion
        const simpleMP3Blob = new Blob([audioBlob], { type: 'audio/mp3' });
        saveFile(fileName, simpleMP3Blob);
        
        toast({
          title: "Basic MP3 Conversion",
          description: `Saved as ${fileName} using basic format conversion`,
        });
      } catch (fallbackError) {
        toast({
          title: "Conversion Error",
          description: `Could not convert to MP3. Try the standard save option instead.`,
          variant: "destructive"
        });
      }
      
      setIsProcessing(false);
    }
  };

  // Discard recording function
  const discardRecording = () => {
    console.log("Discarding recording");
    
    // Cleanup audio URL and blob
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    
    // Reset states
    setAudioUrl(null);
    setAudioBlob(null);
    setDuration(0);
    audioChunksRef.current = [];
    
    // Clean up any remaining resources
    cleanupResources();
    
    toast({
      title: "Recording Discarded",
      description: "Recording has been discarded",
    });
  };

  return (
    <div className={`audio-recorder relative ${className || ''}`}>
      {/* Microphone device selector */}
      <AudioDeviceSelector
        selectedDeviceId={selectedDeviceId}
        onDeviceChange={setSelectedDeviceId}
        disabled={isRecording || isProcessing}
      />
      
      {/* System audio toggle */}
      <AudioSystemToggle 
        captureSystemAudio={captureSystemAudio}
        tabSelected={tabSelected}
        isRecording={isRecording}
        isProcessing={isProcessing}
        onToggle={handleSystemAudioToggle}
      />
      
      {/* Waveform visualization */}
      <AudioVisualization 
        isRecording={isRecording}
        isPaused={isPaused}
        microphoneStream={microphoneStream}
        systemAudioStream={systemAudioStream}
        captureSystemAudio={captureSystemAudio}
        audioUrl={audioUrl}
        canvasHeight={200}
      />
      
      {/* Timer display */}
      <div className="text-center mb-4">
        <span className="text-2xl font-mono">{formatDuration(duration)}</span>
      </div>
      
      {/* Recording controls */}
      <AudioControls 
        isRecording={isRecording}
        isPaused={isPaused}
        audioUrl={audioUrl}
        isProcessing={isProcessing}
        permissionDenied={permissionDenied}
        startRecording={startRecording}
        pauseRecording={pauseRecording}
        resumeRecording={resumeRecording}
        stopRecording={stopRecording}
        saveRecording={saveRecording}
        saveRecordingAsMP4={saveRecordingAsMP4}
        discardRecording={discardRecording}
      />
      
      {/* Audio player for preview */}
      <AudioPlayer 
        audioUrl={audioUrl}
        audioBlob={audioBlob}
        duration={duration}
        captureSystemAudio={captureSystemAudio}
        hasExternalDevice={hasExternalDevice}
      />
      
      {/* Help text */}
      <AudioHelpText 
        captureSystemAudio={captureSystemAudio}
        isRecording={isRecording}
        audioUrl={audioUrl}
        tabSelected={tabSelected}
        hasExternalDevice={hasExternalDevice}
        permissionDenied={permissionDenied}
      />
      
      {/* Processing overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-white/50 dark:bg-black/50 flex items-center justify-center z-10 rounded-md">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-lg">
            <div className="animate-pulse">Processing...</div>
          </div>
        </div>
      )}
    </div>
  );
}
