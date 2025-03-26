// Recording View Controller

// Global variables
let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let isPaused = false;
let recordingTimer;
let recordingSeconds = 0;
let recordingMinutes = 0;
let MAX_RECORDING_MINUTES = 5;
let settings = null;

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
  // Load settings
  loadSettings(() => {
    // Initialize waveform
    const waveformInner = document.getElementById('waveformInner');
    if (waveformInner) {
      createWaveformBars(waveformInner);
    }
    
    // Set up buttons
    const recordBtn = document.getElementById('recordBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    const saveBtn = document.getElementById('saveBtn');
    
    // Set up event listeners
    if (recordBtn) recordBtn.addEventListener('click', startRecording);
    if (pauseBtn) pauseBtn.addEventListener('click', pauseRecording);
    if (stopBtn) stopBtn.addEventListener('click', stopRecording);
    if (saveBtn) saveBtn.addEventListener('click', saveRecording);
    
    // Update recording title when changed
    const recordingTitleInput = document.getElementById('recordingTitleInput');
    const recordingTitle = document.getElementById('recordingTitle');
    
    if (recordingTitleInput && recordingTitle) {
      recordingTitleInput.addEventListener('input', () => {
        recordingTitle.textContent = recordingTitleInput.value || 'New Recording';
      });
    }
  });
});

// Load settings
function loadSettings(callback) {
  chrome.storage.local.get(['settings'], function(result) {
    if (result.settings) {
      settings = result.settings;
      MAX_RECORDING_MINUTES = settings.maxRecordingTime || 5;
    } else {
      // Set default settings
      settings = {
        platformUrl: 'http://localhost:3000',
        checkInterval: 60,
        maxRecordingTime: 5,
        showWaveform: true
      };
      
      // Save default settings
      chrome.storage.local.set({ settings });
    }
    
    if (callback) callback();
  });
}

// Create waveform bars
function createWaveformBars(container) {
  // Clear existing bars
  container.innerHTML = '';
  
  // Create bars
  for (let i = 0; i < 50; i++) {
    const bar = document.createElement('div');
    bar.className = 'waveform-bar';
    container.appendChild(bar);
  }
}

// Start audio recording
async function startRecording() {
  try {
    // Request microphone access
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    
    // Create media recorder
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
    
    // Start recording
    mediaRecorder.start(1000); // Collect data every second
    isRecording = true;
    isPaused = false;
    
    // Start timer
    startTimer();
    
    // Start visualization
    setupAudioVisualization(stream);
    
    // Update UI
    const recordBtn = document.getElementById('recordBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    
    if (recordBtn) recordBtn.disabled = true;
    if (pauseBtn) pauseBtn.disabled = false;
    if (stopBtn) stopBtn.disabled = false;
    
  } catch (error) {
    console.error('Error starting recording:', error);
    alert('Could not access microphone. Please check permissions.');
  }
}

// Pause/resume recording
function pauseRecording() {
  if (!mediaRecorder) return;
  
  const pauseBtn = document.getElementById('pauseBtn');
  
  if (isPaused) {
    // Resume recording
    mediaRecorder.resume();
    isPaused = false;
    pauseBtn.textContent = 'Pause';
    startTimer();
    
    // Resume visualization
    if (audioAnalyser) {
      visualize();
    }
  } else {
    // Pause recording
    mediaRecorder.pause();
    isPaused = true;
    pauseBtn.textContent = 'Resume';
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
  
  // Update UI
  const recordBtn = document.getElementById('recordBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const stopBtn = document.getElementById('stopBtn');
  const saveBtn = document.getElementById('saveBtn');
  
  if (recordBtn) recordBtn.disabled = false;
  if (pauseBtn) {
    pauseBtn.disabled = true;
    pauseBtn.textContent = 'Pause';
  }
  if (stopBtn) stopBtn.disabled = true;
  if (saveBtn) saveBtn.disabled = false;
  
  // Reset waveform
  const waveformBars = document.querySelectorAll('.waveform-bar');
  waveformBars.forEach(bar => {
    bar.style.height = '5%';
  });
}

// Save recording
function saveRecording() {
  if (audioChunks.length === 0) {
    alert('No recording data available');
    return;
  }
  
  const titleInput = document.getElementById('recordingTitleInput');
  const title = titleInput ? titleInput.value || 'Unnamed Recording' : 'Unnamed Recording';
  const timestamp = new Date().toISOString();
  
  // Create blob from chunks
  const mimeType = mediaRecorder.mimeType || 'audio/webm';
  const audioBlob = new Blob(audioChunks, { type: mimeType });
  
  // Convert to base64 for storage
  const reader = new FileReader();
  reader.readAsDataURL(audioBlob);
  reader.onloadend = function() {
    const base64Audio = reader.result;
    
    // Save to Chrome storage
    chrome.storage.local.get(['pendingRecordings'], function(result) {
      const pendingRecordings = result.pendingRecordings || [];
      const newRecording = {
        id: Date.now(),
        title: title,
        timestamp: timestamp,
        audio: base64Audio,
        processed: false
      };
      
      pendingRecordings.push(newRecording);
      
      chrome.storage.local.set({ pendingRecordings: pendingRecordings }, function() {
        alert('Recording saved successfully');
        
        // Reset the UI
        if (titleInput) titleInput.value = '';
        
        // Reset the recording title
        const recordingTitle = document.getElementById('recordingTitle');
        if (recordingTitle) recordingTitle.textContent = 'New Recording';
        
        // Disable save button
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) saveBtn.disabled = true;
        
        // Also save to downloads
        const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = `wizzo_recording_${sanitizedTitle}_${Date.now()}.webm`;
        
        // Use the downloads API to save the file
        chrome.downloads.download({
          url: URL.createObjectURL(audioBlob),
          filename: filename,
          saveAs: false
        });
        
        // Notify background script to sync
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
  
  // Update timer display
  const timerDisplay = document.getElementById('timer');
  if (timerDisplay) {
    timerDisplay.textContent = `${recordingMinutes.toString().padStart(2, '0')}:${recordingSeconds.toString().padStart(2, '0')}`;
  }
  
  // Check if reached maximum recording time
  if (recordingMinutes >= MAX_RECORDING_MINUTES) {
    stopRecording();
    alert(`Recording stopped after ${MAX_RECORDING_MINUTES} minutes`);
  }
}

// Audio visualization
let audioContext;
let audioAnalyser;
let dataArray;
let animationFrameId;

// Set up audio visualization
function setupAudioVisualization(stream) {
  try {
    // Create audio context
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioAnalyser = audioContext.createAnalyser();
    audioAnalyser.fftSize = 256;
    
    // Connect stream to analyser
    const mediaStreamSource = audioContext.createMediaStreamSource(stream);
    mediaStreamSource.connect(audioAnalyser);
    
    // Create data array
    const bufferLength = audioAnalyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    
    // Start visualization
    visualize();
  } catch (error) {
    console.error('Error setting up audio visualization:', error);
    // Continue without visualization
  }
}

// Visualize audio
function visualize() {
  if (!audioAnalyser) return;
  
  animationFrameId = requestAnimationFrame(visualize);
  
  // Get frequency data
  audioAnalyser.getByteFrequencyData(dataArray);
  
  // Update waveform bars
  const waveformBars = document.querySelectorAll('.waveform-bar');
  const barCount = waveformBars.length;
  
  for (let i = 0; i < barCount; i++) {
    const index = Math.floor(i * dataArray.length / barCount);
    const value = dataArray[index];
    const height = (value / 255) * 100;
    waveformBars[i].style.height = `${Math.max(5, height)}%`;
  }
}
