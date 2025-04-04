/**
 * Audio utilities for capturing and processing audio streams
 */

/**
 * Test the audio output to verify capture is working
 * @param stream MediaStream to test
 * @returns A promise that resolves when testing is complete
 */
export async function testAudioOutput(stream: MediaStream): Promise<boolean> {
  return new Promise((resolve) => {
    console.log("Testing audio output for stream");
    
    // Create a temporary audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create an analyzer to check if we're getting audio data
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // Create source from stream
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    
    // Variables to track activity
    let soundDetected = false;
    let sampleCount = 0;
    const maxSamples = 100;
    
    // Sample the audio data to detect sound
    const checkForAudio = () => {
      if (sampleCount >= maxSamples) {
        // Clean up
        source.disconnect();
        audioContext.close();
        
        console.log(`Audio test complete. Sound detected: ${soundDetected}`);
        resolve(soundDetected);
        return;
      }
      
      // Get audio data
      analyser.getByteTimeDomainData(dataArray);
      
      // Check for non-silence (values that deviate from 128)
      let volumeSum = 0;
      for (let i = 0; i < bufferLength; i++) {
        volumeSum += Math.abs(dataArray[i] - 128);
      }
      
      const averageVolume = volumeSum / bufferLength;
      
      // If we detect sound above a threshold
      if (averageVolume > 1.5) {
        console.log(`Sound detected! Average volume: ${averageVolume.toFixed(2)}`);
        soundDetected = true;
        
        // We can end early if sound is detected
        source.disconnect();
        audioContext.close();
        resolve(true);
        return;
      }
      
      sampleCount++;
      
      // Continue sampling
      setTimeout(checkForAudio, 50);
    };
    
    // Start the check
    checkForAudio();
  });
}

/**
 * Enumerate and log all available audio input/output devices
 * @returns An object containing audio input and output devices
 */
export async function enumerateAudioDevices(): Promise<{
  inputs: MediaDeviceInfo[];
  outputs: MediaDeviceInfo[];
}> {
  try {
    // Request device permissions first to ensure we get all devices
    await navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      // Stop the stream immediately as we only need it for permissions
      stream.getTracks().forEach(track => track.stop());
    }).catch(err => {
      console.warn("Permission request failed, device list may be incomplete:", err);
    });
    
    // Get all devices
    const devices = await navigator.mediaDevices.enumerateDevices();
    
    // Filter audio devices
    const inputs = devices.filter(device => device.kind === 'audioinput');
    const outputs = devices.filter(device => device.kind === 'audiooutput');
    
    // Log devices for debugging
    console.log('Available audio inputs:', inputs.length);
    inputs.forEach((device, index) => {
      console.log(`Input ${index + 1}:`, {
        deviceId: device.deviceId,
        groupId: device.groupId,
        label: device.label || 'Unnamed device'
      });
    });
    
    console.log('Available audio outputs:', outputs.length);
    outputs.forEach((device, index) => {
      console.log(`Output ${index + 1}:`, {
        deviceId: device.deviceId,
        groupId: device.groupId,
        label: device.label || 'Unnamed device'
      });
    });
    
    return { inputs, outputs };
  } catch (error) {
    console.error("Failed to enumerate audio devices:", error);
    return { inputs: [], outputs: [] };
  }
}

// Keep track of last request time to prevent rapid requests
let lastRequestTime = 0;
let pendingRequest = false;

/**
 * Request system audio via screen capture API with improved error handling and cooldown
 * @param retryCount Optional number of retries (defaults to 0)
 * @returns A MediaStream containing only the audio tracks from screen capture, or null on failure
 */
export async function getSystemAudioStream(retryCount = 0): Promise<MediaStream | null> {
  // Prevent multiple simultaneous calls
  if (pendingRequest) {
    console.log("Already requesting system audio, waiting...");
    // Wait for the current request to finish (max 5 seconds)
    try {
      await new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!pendingRequest) {
            clearInterval(checkInterval);
            resolve(null);
          }
        }, 100);
        // Set a timeout of 5 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve(null);
          pendingRequest = false; // Reset if stuck
        }, 5000);
      });
    } catch (e) {
      console.error("Error waiting for pending request", e);
    }
  }
  
  // Implement a cooldown period to prevent rapid requests (minimum 1 second between requests)
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < 1000) {
    const waitTime = 1000 - timeSinceLastRequest;
    console.log(`Too many requests, cooling down for ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  // Set pending flag and update last request time
  pendingRequest = true;
  lastRequestTime = Date.now();
  
  try {
    console.log("Requesting screen capture with audio (try #" + (retryCount + 1) + ")");
    
    // Log information about available audio devices first
    await enumerateAudioDevices();
    
    // Request display media with audio enabled and specific preferences
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: 'never',  // Don't show cursor
        displaySurface: 'browser', // Prefer browser tabs
      },
      audio: {
        // The following constraints improve audio quality
        autoGainControl: false,
        echoCancellation: false, // Disable echo cancellation for cleaner system audio
        noiseSuppression: false, // Disable noise suppression for cleaner system audio
        latency: 0,  // Request lowest possible latency
        sampleRate: 48000, // High quality sample rate
        channelCount: 2,   // Stereo
      }
    }).catch((err) => {
      console.error("Error during getDisplayMedia:", err.name, err.message);
      throw new Error(`Screen capture failed: ${err.name}: ${err.message}`);
    });
    
    // If we reach here, we have a stream
    pendingRequest = false;
    
    // Check if we actually got audio tracks
    const audioTracks = stream.getAudioTracks();
    
    if (audioTracks.length === 0) {
      console.warn("No audio tracks found in screen capture");
      // Close the video tracks since we don't need them
      stream.getVideoTracks().forEach(track => {
        console.log("Stopping video track:", track.label);
        track.stop();
      });
      return null;
    }
    
    console.log(`Got ${audioTracks.length} audio tracks from screen capture:`);
    audioTracks.forEach((track, i) => {
      console.log(`Track ${i+1}:`, {
        id: track.id,
        kind: track.kind,
        label: track.label,
        enabled: track.enabled,
        readyState: track.readyState,
        muted: track.muted,
        constraints: track.getConstraints()
      });
    });
    
    // Create a new stream with only the audio tracks
    const audioStream = new MediaStream(audioTracks);
    
    // Stop video tracks as we only need audio
    stream.getVideoTracks().forEach(track => {
      console.log("Stopping video track:", track.label);
      track.stop();
    });
    
    return audioStream;
  } catch (error) {
    pendingRequest = false;
    console.error("Error getting system audio:", error);
    
    // Handle specific error types with better error messages and retry logic
    if (error instanceof Error) {
      // Get the error name or message, handling various error formats
      const errorName = error.name || (error.message && error.message.includes(':') ? error.message.split(':')[0].trim() : '');
      
      // Handle specific error cases
      switch (errorName) {
        case 'NotAllowedError':
          console.error("User denied permission to capture screen");
          break;
        case 'NotFoundError':
          console.error("No audio device found or the audio device is disabled");
          break;
        case 'NotReadableError':
          console.error("Could not access audio device, it might be in use by another application");
          break;
        case 'AbortError':
          console.error("The operation was aborted, possibly due to invalid state");
          
          // Special handling for AbortError - we'll retry a few times
          if (retryCount < 2) { // Max 3 attempts (0, 1, 2)
            console.log(`Retry attempt ${retryCount + 1} after AbortError...`);
            // Wait a bit longer before retrying
            await new Promise(resolve => setTimeout(resolve, 1000 + (retryCount * 500)));
            return getSystemAudioStream(retryCount + 1);
          }
          break;
        default:
          console.error(`Unhandled error type: ${errorName || 'Unknown'}`);
      }
    }
    return null;
  }
}

/**
 * Get microphone stream with optimal quality settings
 * @param deviceOptions Optional device selection options
 * @returns A MediaStream from the microphone, or null on failure
 */
export async function getMicrophoneStream(deviceOptions?: {
  preferredDeviceId?: string;
  useDefaultDevice?: boolean;
}): Promise<MediaStream | null> {
  try {
    console.log("Requesting microphone access");
    
    // Get available devices to log them
    const devices = await enumerateAudioDevices();
    
    // Build constraints based on options
    const constraints: MediaTrackConstraints = {
      echoCancellation: true,    // Reduce echo during calls
      noiseSuppression: true,    // Reduce background noise
      autoGainControl: true,     // Adjust volume automatically
      sampleRate: 48000,         // High quality sample rate
      channelCount: 2,           // Stereo recording
      latency: 0                 // Low latency
    };
    
    // Add device id constraints if requested
    if (deviceOptions?.preferredDeviceId) {
      console.log(`Using preferred device ID: ${deviceOptions.preferredDeviceId}`);
      constraints.deviceId = deviceOptions.preferredDeviceId;
    } else if (deviceOptions?.useDefaultDevice) {
      console.log("Using system default communication device");
      constraints.deviceId = "default";
    } else if (devices.inputs.length > 0) {
      // If no specific device is requested, and external devices are available,
      // log their presence to help with debugging
      const externalDevices = devices.inputs.filter(device => 
        device.label.toLowerCase().includes("airpods") ||
        device.label.toLowerCase().includes("headphone") ||
        device.label.toLowerCase().includes("headset")
      );
      
      if (externalDevices.length > 0) {
        console.log("External audio devices detected:", 
          externalDevices.map(d => d.label).join(", ")
        );
      }
    }
    
    console.log("Requesting microphone with constraints:", constraints);
    
    // Request user media with specified constraints
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: constraints
    });
    
    // Log success and stream details
    const tracks = stream.getAudioTracks();
    console.log(`Microphone access granted. Got ${tracks.length} audio tracks:`);
    tracks.forEach((track, i) => {
      console.log(`Track ${i+1}:`, {
        id: track.id,
        kind: track.kind,
        label: track.label || 'Unnamed microphone',
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState,
        settings: track.getSettings() // Get actual settings applied
      });
    });
    
    return stream;
  } catch (error) {
    console.error("Error getting microphone:", error);
    
    // Provide more detailed error messages
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        console.error("User denied microphone permission");
      } else if (error.name === 'NotFoundError') {
        console.error("No microphone found or the microphone is disabled");
      } else if (error.name === 'NotReadableError') {
        console.error("Could not access microphone, it might be in use by another application");
      } else if (error.name === 'OverconstrainedError') {
        console.error("The specified constraints cannot be satisfied");
      }
    }
    
    return null;
  }
}

/**
 * Mix multiple audio streams into one using Web Audio API with improved gain control
 * @param streams Array of MediaStreams to mix
 * @param options Optional mixing options for controlling gain levels
 * @param context Optional existing AudioContext to use
 * @returns An object containing the mixed stream and references to created audio nodes
 */
export function mixAudioStreams(
  streams: MediaStream[],
  options?: {
    micGain?: number; // Gain for microphone (0-2, default 1)
    systemGain?: number; // Gain for system audio (0-2, default 1)
  },
  context?: AudioContext
): { 
  stream: MediaStream; 
  context: AudioContext;
  analyser: AnalyserNode;
  sources: MediaStreamAudioSourceNode[];
  gainNodes: GainNode[];
} {
  // Default gain values
  const micGain = options?.micGain ?? 1.0; // Default to 1.0 (unchanged)
  const systemGain = options?.systemGain ?? 1.0; // Default to 1.0 (unchanged)
  
  console.log(`Mixing ${streams.length} audio streams with mic gain: ${micGain}, system gain: ${systemGain}`);
  
  // Create a new context if none provided
  const ctx = context || new (window.AudioContext || (window as any).webkitAudioContext)();
  
  // Check context state and handle it
  if (ctx.state === 'suspended') {
    console.log('AudioContext suspended, attempting to resume...');
    ctx.resume().catch(err => console.error('Failed to resume AudioContext:', err));
  }
  
  // Create a destination for the mixed audio
  const destination = ctx.createMediaStreamDestination();
  
  // Create an analyzer for visualization
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 4096; // Increased for better visualization detail
  analyser.smoothingTimeConstant = 0.8; // Smoother visualization
  
  // Arrays to store nodes
  const sources: MediaStreamAudioSourceNode[] = [];
  const gainNodes: GainNode[] = [];
  
  // Create an extra channel merger to ensure proper mixing
  const merger = ctx.createChannelMerger(streams.length);
  merger.connect(destination);
  merger.connect(analyser);
  
  // Connect each stream to both the analyser and destination with gain control
  streams.forEach((stream, index) => {
    // Determine if this is likely the microphone (first stream) or system audio
    const isLikelyMicrophone = index === 0;
    const trackLabel = stream.getAudioTracks()[0]?.label?.toLowerCase() || 'unknown';
    const isDefinitelyMicrophone = trackLabel.includes('mic') || 
                               trackLabel.includes('headset') ||
                               trackLabel.includes('microphone') ||
                               trackLabel.includes('input');
    
    const isMicrophone = isLikelyMicrophone || isDefinitelyMicrophone;
    console.log(`Stream ${index + 1} identified as: ${isMicrophone ? 'microphone' : 'system audio'} (${trackLabel})`);
    
    // Create source from the stream
    const source = ctx.createMediaStreamSource(stream);
    sources.push(source);
    
    // Create a gain node to control volume
    const gain = ctx.createGain();
    gainNodes.push(gain);
    
    // Set gain based on whether this is mic or system audio - use higher mic gain to ensure it's heard
    if (isMicrophone) {
      // Use a higher gain for microphone to make it more prominent
      const actualMicGain = Math.max(1.2, micGain); // Ensure minimum 1.2 gain
      gain.gain.value = actualMicGain;
      console.log(`Setting microphone gain to ${actualMicGain} (requested: ${micGain})`);
    } else {
      gain.gain.value = systemGain;
      console.log(`Setting system audio gain to ${systemGain}`);
    }
    
    // Connect source -> gain -> merger (and directly to destination as fallback)
    source.connect(gain);
    gain.connect(merger);
    
    // Also connect directly to destination as a fallback path
    gain.connect(destination);
    gain.connect(analyser);
  });
  
  // Check the number of channels in the destination
  const numChannels = destination.stream.getAudioTracks()[0]?.getSettings().channelCount || 0;
  console.log(`Mixed output stream has ${numChannels} audio channel(s)`);
  
  // Log all tracks in the mixed stream
  destination.stream.getTracks().forEach((track, i) => {
    console.log(`Output track ${i+1}:`, track.label, track.readyState);
  });
  
  return {
    stream: destination.stream,
    context: ctx,
    analyser,
    sources,
    gainNodes
  };
}

/**
 * Find the best supported audio MIME type for recording
 * @returns The best supported MIME type string
 */
export function getBestSupportedMimeType(): string {
  // Prioritize WebM with opus codec
  if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
    return 'audio/webm;codecs=opus';
  } 
  // Fall back to general WebM
  else if (MediaRecorder.isTypeSupported('audio/webm')) {
    return 'audio/webm';
  }
  // Last resort for Safari
  else if (MediaRecorder.isTypeSupported('audio/mp4')) {
    return 'audio/mp4';
  }
  // Absolute fallback
  return '';
}

/**
 * Clean up audio resources safely
 * @param mediaStream MediaStream to clean up
 * @param audioContext AudioContext to clean up
 * @param sourceNodes Array of source nodes to disconnect
 * @param gainNodes Array of gain nodes to disconnect
 */
export function cleanupAudioResources(
  mediaStream: MediaStream | null,
  audioContext: AudioContext | null,
  sourceNodes: MediaStreamAudioSourceNode[] = [],
  gainNodes: GainNode[] = []
): void {
  // Stop media tracks
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => {
      try {
        console.log(`Stopping track: ${track.kind} - ${track.label}`);
        track.stop();
      } catch (e) {
        console.error("Error stopping track:", e);
      }
    });
  }
  
  // Clean up gain nodes
  gainNodes.forEach(node => {
    try {
      console.log("Disconnecting gain node");
      node.gain.value = 0; // Prevent any possible clicks
      node.disconnect();
    } catch (error) {
      console.log("Error disconnecting gain node:", error);
    }
  });
  
  // Clean up source nodes
  sourceNodes.forEach(source => {
    try {
      console.log("Disconnecting source node");
      source.disconnect();
    } catch (error) {
      console.log("Error disconnecting source node:", error);
    }
  });
  
  // Close audio context only if it's not already closed
  if (audioContext) {
    try {
      if (audioContext.state !== 'closed') {
        console.log("Closing AudioContext");
        audioContext.close().catch(e => {
          console.error("Error closing AudioContext:", e);
        });
      } else {
        console.log("AudioContext already closed");
      }
    } catch (error) {
      console.log("Error handling audio context:", error);
    }
  }
  
  console.log("Audio resources cleanup complete");
}
