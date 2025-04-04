/**
 * Audio utilities for capturing and processing audio streams
 */

// An alternative to MP3 conversion for browsers without proper MP3 encoding support
export async function convertAudioToFile(blob: Blob, targetFormat: 'mp3' | 'wav' | 'webm' = 'mp3'): Promise<Blob> {
  // If the blob is already in the target format, return it as is
  if ((targetFormat === 'mp3' && isMP3Blob(blob)) ||
      (targetFormat === 'webm' && blob.type.includes('webm'))) {
    return blob;
  }
  
  try {
    // For WAV conversion, we can do it directly in the browser
    if (targetFormat === 'wav') {
      return await convertToWAV(blob);
    }
    
    // For MP3, we'll use a simple format change as fallback
    // This doesn't actually convert the audio data but changes the extension
    // It's not a proper conversion but better than nothing when lamejs fails
    return new Blob([blob], { type: `audio/${targetFormat}` });
  } catch (error) {
    console.error(`Failed to convert audio to ${targetFormat}:`, error);
    // Return the original blob as fallback
    return blob;
  }
}

// Simple WAV conversion using AudioContext (more reliable than MP3 conversion)
async function convertToWAV(blob: Blob): Promise<Blob> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // WAV format parameters
    const numOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const bitsPerSample = 16; // Standard CD quality
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numOfChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    
    // Calculate data size and allocate buffer
    const samples = numOfChannels * audioBuffer.length;
    const bufferLength = 44 + (samples * bytesPerSample); // 44 bytes for WAV header
    const buffer = new ArrayBuffer(bufferLength);
    const view = new DataView(buffer);
    
    // Write WAV header
    writeString(view, 0, 'RIFF'); // RIFF identifier
    view.setUint32(4, 36 + samples * bytesPerSample, true); // File size minus RIFF identifier length and size
    writeString(view, 8, 'WAVE'); // Format
    writeString(view, 12, 'fmt '); // Format chunk identifier
    view.setUint32(16, 16, true); // Format chunk length
    view.setUint16(20, 1, true); // Sample format (1 is PCM)
    view.setUint16(22, numOfChannels, true); // Number of channels
    view.setUint32(24, sampleRate, true); // Sample rate
    view.setUint32(28, byteRate, true); // Byte rate
    view.setUint16(32, blockAlign, true); // Block align
    view.setUint16(34, bitsPerSample, true); // Bits per sample
    writeString(view, 36, 'data'); // Data chunk identifier
    view.setUint32(40, samples * bytesPerSample, true); // Data chunk length
    
    // Write audio data
    const offset = 44;
    let pos = offset;
    
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
        const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(pos, value, true);
        pos += bytesPerSample;
      }
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  } catch (error) {
    console.error('Error converting to WAV:', error);
    throw error;
  } finally {
    await audioContext.close();
  }
}

// Helper function to write strings to DataView
function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

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

/**
 * Check if a Blob is in MP4 format
 * @param blob The blob to check
 * @returns True if the blob is in MP4 format
 */
export function isMP4Blob(blob: Blob): boolean {
  return blob.type.includes('mp4') || blob.type.includes('audio/mp4');
}

/**
 * Check if a Blob is in MP3 format
 * @param blob The blob to check
 * @returns True if the blob is in MP3 format
 */
export function isMP3Blob(blob: Blob): boolean {
  return blob.type.includes('mp3') || blob.type.includes('audio/mp3');
}

/**
 * Convert audio blob to MP3 format using lamejs
 * @param blob Input audio blob (WebM or other format)
 * @param sampleRate Sample rate for conversion (default: 44100)
 * @param bitRate Bit rate for MP3 (default: 128)
 * @returns Promise resolving to MP3 blob
 */
export async function convertToMP3(blob: Blob, sampleRate = 44100, bitRate = 128): Promise<Blob> {
  console.log("Converting audio to MP3 format, input type:", blob.type);
  
  // If already MP3, just return the blob
  if (isMP3Blob(blob)) {
    console.log("Audio is already in MP3 format, skipping conversion");
    return blob;
  }
  
  // Create an AudioContext for decoding
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  try {
    // Read the blob as an ArrayBuffer
    const arrayBuffer = await blob.arrayBuffer();
    
    // Decode the audio data
    console.log("Decoding audio data...");
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    console.log("Audio decoded successfully:", {
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      numberOfChannels: audioBuffer.numberOfChannels
    });
    
    // Import lamejs with require to make sure it's properly loaded
    // Note: Dynamic import could have issues in some build environments
    const lamejs = require('lamejs');
    
    // Create MP3 encoder with explicit mode for stereo/mono
    const mp3encoder = new lamejs.Mp3Encoder(
      audioBuffer.numberOfChannels, // 1 for mono, 2 for stereo
      sampleRate,                   // Sample rate (usually 44100)
      bitRate                       // Bit rate (128 is standard quality)
    );
    
    // Get audio data
    const channels = [];
    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
      channels.push(audioBuffer.getChannelData(i));
    }
    
    // Process in chunks to avoid memory issues
    const CHUNK_SIZE = 1152; // Must be divisible by 576 (LAME algorithm constraint)
    const chunks = [];
    const totalSamples = audioBuffer.length;
    
    console.log("Processing audio in chunks...");
    
    // Convert Float32Array samples to Int16Array for lamejs
    for (let i = 0; i < totalSamples; i += CHUNK_SIZE) {
      const leftChunk = new Int16Array(Math.min(CHUNK_SIZE, totalSamples - i));
      const rightChunk = audioBuffer.numberOfChannels > 1 
        ? new Int16Array(Math.min(CHUNK_SIZE, totalSamples - i))
        : null;
      
      // Convert float32 to int16
      for (let j = 0; j < leftChunk.length; j++) {
        if (i + j < totalSamples) {
          // Convert float [-1, 1] to int16 [-32768, 32767]
          leftChunk[j] = Math.max(-32768, Math.min(32767, Math.round(channels[0][i + j] * 32767)));
          
          if (rightChunk && channels.length > 1) {
            rightChunk[j] = Math.max(-32768, Math.min(32767, Math.round(channels[1][i + j] * 32767)));
          }
        }
      }
      
      // Encode chunk
      let mp3buf;
      if (audioBuffer.numberOfChannels === 1) {
        mp3buf = mp3encoder.encodeBuffer(leftChunk);
      } else {
        mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
      }
      
      if (mp3buf && mp3buf.length > 0) {
        chunks.push(mp3buf);
      }
    }
    
    // Get the last chunk
    const lastChunk = mp3encoder.flush();
    if (lastChunk && lastChunk.length > 0) {
      chunks.push(lastChunk);
    }
    
    // Combine chunks into a single MP3 blob
    console.log("Finalizing MP3 conversion, chunks:", chunks.length);
    const mp3Data = new Blob(chunks, { type: 'audio/mp3' });
    
    console.log("MP3 conversion complete, size:", mp3Data.size);
    return mp3Data;
  } catch (error) {
    console.error("MP3 conversion failed:", error);
    throw new Error(`MP3 conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    // Close the audio context
    if (audioContext.state !== 'closed') {
      await audioContext.close();
    }
  }
}

/**
 * Save a file with the given name and blob
 * @param fileName The name to save the file as
 * @param blob The blob to save
 * @param mimeType Optional MIME type for the download
 */
export function saveFile(fileName: string, blob: Blob, mimeType?: string): void {
  // Create object URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Create a download link
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  
  // Trigger download
  a.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}
