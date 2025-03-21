// Global variables
let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let isPaused = false;
let recordingTimer;
let recordingSeconds = 0;
let recordingMinutes = 0;
let MAX_RECORDING_MINUTES = 5;
let audioContext;
let audioAnalyser;
let mediaStreamSource;
let dataArray;
let settings = {
  platformUrl: 'http://localhost:3000',
  showWaveform: true,
  maxRecordingTime: 5
};

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
  const recordBtn = document.getElementById('recordBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const stopBtn = document.getElementById('stopBtn');
  const timerDisplay = document.getElementById('timerDisplay');
  const statusText = document.getElementById('statusText');
  const waveformContainer = document.getElementById('waveformContainer');
  
  // Load settings
  loadSettings();
  
  // Create waveform bars
  createWaveformBars(waveformContainer);
  
  // Recording functionality
  recordBtn.addEventListener('click', startRecording);
  pauseBtn.addEventListener('click', pauseRecording);
  stopBtn.addEventListener('click', stopRecording);
  
  // Keep this tab alive even if it's not active
  navigator.mediaSession.setActionHandler('pause', () => {
    pauseRecording();
  });
  
  // Keep the tab from being closed accidentally
  window.addEventListener('beforeunload', function(e) {
    if (isRecording) {
      // Cancel the event
      e.preventDefault();
      // Chrome requires returnValue to be set
      e.returnValue = 'Recording in progress. Are you sure you want to leave?';
    }
  });
  
  // Check window visibility
  document.addEventListener('visibilitychange', function() {
    if (document.hidden && isRecording) {
      // Notify user somehow that recording is still happening
      if ('Notification' in window) {
        Notification.requestPermission().then(function(permission) {
          if (permission === 'granted') {
            new Notification('Wizzo Recording', {
              body: 'Recording is still in progress',
              icon: 'icons/icon128.png'
            });
          }
        });
      }
    }
  });
});

// Load settings from storage
function loadSettings() {
  chrome.storage.local.get(['settings'], function(result) {
    if (result.settings) {
      settings = result.settings;
      MAX_RECORDING_MINUTES = settings.maxRecordingTime;
      
      // Update UI based on settings
      if (!settings.showWaveform) {
        const waveformEl = document.querySelector('.waveform');
        if (waveformEl) waveformEl.style.display = 'none';
      }
      
      // Update recording time limit display
      const statusTextEl = document.getElementById('statusText');
      if (statusTextEl) {
        statusTextEl.textContent = `Ready to record (max ${settings.maxRecordingTime} min)`;
      }
    }
  });
}

// Create waveform bars
function createWaveformBars(container) {
  // Clear existing bars
  container.innerHTML = '';
  
  // Create bars
  for (let i = 0; i < 100; i++) {
    const bar = document.createElement('div');
    bar.className = 'waveform-bar';
    container.appendChild(bar);
  }
}

// Capture system audio and microphone
async function startRecording() {
  try {
    // First try to capture desktop audio which includes system sounds
    let stream = null;
    
    try {
      // Try to use desktop capture for system audio
      if (navigator.mediaDevices.getDisplayMedia) {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: false
        });
        
        // Check if we got audio tracks
        if (displayStream.getAudioTracks().length > 0) {
          console.log('Successfully captured desktop audio');
          
          // Also get microphone audio
          const micStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
          
          // Combine the streams
          const audioContext = new AudioContext();
          const desktopSource = audioContext.createMediaStreamSource(displayStream);
          const micSource = audioContext.createMediaStreamSource(micStream);
          const destination = audioContext.createMediaStreamDestination();
          
          desktopSource.connect(destination);
          micSource.connect(destination);
          
          stream = destination.stream;
        } else {
          throw new Error('No audio tracks available in display capture');
        }
      }
    } catch (err) {
      console.log('Desktop capture not available:', err);
    }
    
    // If desktop capture failed, fall back to just microphone
    if (!stream) {
      console.log('Falling back to microphone only');
      stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Attempt to get system audio on macOS
          // Note: This doesn't work with AirPods but we try anyway
          sampleRate: 44100,
          channelCount: 2
        }
      });
    }
    
    // Create media recorder with appropriate codec
    const options = { mimeType: 'audio/webm' };
    try {
      mediaRecorder = new MediaRecorder(stream, options);
    } catch (e) {
      console.log('MediaRecorder with specified options not supported, falling back to default');
      mediaRecorder = new MediaRecorder(stream);
    }
    
    audioChunks = [];
    
    // Set up event handlers
    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };
    
    mediaRecorder.onstop = saveRecording;
    
    // Start recording
    mediaRecorder.start(1000); // Collect data every second
    isRecording = true;
    isPaused = false;
    
    // Start timer
    startTimer();
    
    // Set up audio visualization if enabled
    if (settings.showWaveform) {
      setupAudioVisualization(stream);
    }
    
    // Update UI
    document.getElementById('recordBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;
    document.getElementById('stopBtn').disabled = false;
    document.getElementById('statusText').textContent = 'Recording...';
    
  } catch (error) {
    console.error('Error starting recording:', error);
    document.getElementById('statusText').textContent = 'Error: Could not start recording. Please check microphone permissions.';
    
    // Show more detailed error
    const errorDetails = document.createElement('div');
    errorDetails.className = 'error-details';
    errorDetails.textContent = error.toString();
    document.getElementById('statusText').appendChild(errorDetails);
  }
}

// Pause/resume recording
function pauseRecording() {
  if (!mediaRecorder) return;
  
  if (isPaused) {
    // Resume recording
    mediaRecorder.resume();
    isPaused = false;
    document.getElementById('pauseBtn').textContent = 'Pause';
    document.getElementById('statusText').textContent = 'Recording...';
    startTimer();
    
    // Resume visualization if it was set up
    if (audioAnalyser) {
      visualize();
    }
  } else {
    // Pause recording
    mediaRecorder.pause();
    isPaused = true;
    document.getElementById('pauseBtn').textContent = 'Resume';
    document.getElementById('statusText').textContent = 'Paused';
    clearInterval(recordingTimer);
    
    // Pause visualization
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }
}

// Stop recording
function stopRecording() {
  if (!mediaRecorder) return;
  
  // Stop the media recorder
  mediaRecorder.stop();
  
  // Stop all audio tracks
  mediaRecorder.stream.getTracks().forEach(track => track.stop());
  
  // Reset state
  isRecording = false;
  isPaused = false;
  
  // Stop timer
  clearInterval(recordingTimer);
  
  // Stop visualization
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  
  // Clean up audio context
  if (audioContext) {
    audioContext.close();
    audioContext = null;
    audioAnalyser = null;
  }
  
  // Reset UI
  document.getElementById('recordBtn').disabled = false;
  document.getElementById('pauseBtn').disabled = true;
  document.getElementById('stopBtn').disabled = true;
  document.getElementById('pauseBtn').textContent = 'Pause';
  document.getElementById('statusText').textContent = 'Recording stopped';
  
  // Reset waveform
  const waveformBars = document.querySelectorAll('.waveform-bar');
  waveformBars.forEach(bar => {
    bar.style.height = '10%';
  });
}

// Save the recording
function saveRecording() {
  if (audioChunks.length === 0) return;
  
  const title = document.getElementById('recordingTitle').value || 'Unnamed Recording';
  const timestamp = new Date().toISOString();
  
  // Create blob with appropriate mime type
  const mimeType = mediaRecorder.mimeType || 'audio/webm';
  const audioBlob = new Blob(audioChunks, { type: mimeType });
  
  // Create audio element and play preview
  const audioPreview = document.createElement('audio');
  audioPreview.controls = true;
  audioPreview.src = URL.createObjectURL(audioBlob);
  
  // Add preview to the page
  const previewContainer = document.createElement('div');
  previewContainer.className = 'preview-container';
  previewContainer.innerHTML = '<h3>Preview</h3>';
  previewContainer.appendChild(audioPreview);
  
  // Remove any existing preview
  const existingPreview = document.querySelector('.preview-container');
  if (existingPreview) {
    existingPreview.remove();
  }
  
  // Add preview before the status text
  const statusText = document.getElementById('statusText');
  statusText.parentNode.insertBefore(previewContainer, statusText);
  
  // Convert blob to base64 for storage
  const reader = new FileReader();
  reader.readAsDataURL(audioBlob);
  reader.onloadend = function() {
    const base64Audio = reader.result;
    
    // Save to Chrome storage
    chrome.storage.local.get(['pendingRecordings'], function(result) {
      const pendingRecordings = result.pendingRecordings || [];
      pendingRecordings.push({
        id: Date.now(),
        title: title,
        timestamp: timestamp,
        audio: base64Audio,
        processed: false
      });
      
      chrome.storage.local.set({ pendingRecordings: pendingRecordings }, function() {
        // Update status
        document.getElementById('statusText').textContent = 'Recording saved! You can now close this tab.';
        
        // Also save to disk
        const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = `wizzo_recording_${sanitizedTitle}_${Date.now()}.webm`;
        
        // Save to the wizzo recording directory if possible
        const localDirUrl = settings.platformUrl + '/storage/recordings';
        
        // Use the downloads API to save the file
        chrome.downloads.download({
          url: URL.createObjectURL(audioBlob),
          filename: filename,
          saveAs: false
        }, function(downloadId) {
          const notification = document.createElement('div');
          notification.className = 'notification';
          notification.textContent = `File saved to your downloads folder as ${filename}`;
          statusText.parentNode.insertBefore(notification, statusText.nextSibling);
        });
        
        // Add notification about auto-processing
        const autoProcessNotification = document.createElement('div');
        autoProcessNotification.className = 'notification';
        autoProcessNotification.textContent = 'Recording will be automatically processed when Wizzo platform is online.';
        statusText.parentNode.insertBefore(autoProcessNotification, statusText.nextSibling);
        
        // Reset form
        document.getElementById('recordingTitle').value = '';
        resetTimer();
        
        // Check if Wizzo is running and attempt to process immediately
        chrome.runtime.sendMessage({ action: 'syncNow' });
      });
    });
  };
}

// Timer functions
function startTimer() {
  clearInterval(recordingTimer);
  recordingTimer = setInterval(updateTimer, 1000);
}

function updateTimer() {
  recordingSeconds++;
  if (recordingSeconds >= 60) {
    recordingSeconds = 0;
    recordingMinutes++;
  }
  
  // Update the display
  const timerDisplay = document.getElementById('timerDisplay');
  timerDisplay.textContent = `${recordingMinutes.toString().padStart(2, '0')}:${recordingSeconds.toString().padStart(2, '0')}`;
  
  // Check if we've reached the limit
  if (recordingMinutes >= MAX_RECORDING_MINUTES) {
    stopRecording();
    document.getElementById('statusText').textContent = `Recording stopped after ${MAX_RECORDING_MINUTES} minutes`;
  }
}

function resetTimer() {
  clearInterval(recordingTimer);
  recordingSeconds = 0;
  recordingMinutes = 0;
  document.getElementById('timerDisplay').textContent = '00:00';
}

// Audio visualization
let animationFrameId = null;

function setupAudioVisualization(stream) {
  try {
    // Create audio context
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioAnalyser = audioContext.createAnalyser();
    audioAnalyser.fftSize = 256;
    
    // Connect the media stream to the analyzer
    mediaStreamSource = audioContext.createMediaStreamSource(stream);
    mediaStreamSource.connect(audioAnalyser);
    
    // Set up data array for visualization
    const bufferLength = audioAnalyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    
    // Start visualization
    visualize();
  } catch (error) {
    console.error('Error setting up audio visualization:', error);
    // Fail silently, recording can still work without visualization
  }
}

function visualize() {
  if (!audioAnalyser) return;
  
  animationFrameId = requestAnimationFrame(visualize);
  
  // Get frequency data
  audioAnalyser.getByteFrequencyData(dataArray);
  
  // Update waveform
  const waveformBars = document.querySelectorAll('.waveform-bar');
  const barCount = waveformBars.length;
  
  // Map the data array to the bars
  for (let i = 0; i < barCount; i++) {
    const index = Math.floor(i * dataArray.length / barCount);
    const value = dataArray[index];
    const height = (value / 255) * 100;
    waveformBars[i].style.height = `${Math.max(5, height)}%`;
  }
}