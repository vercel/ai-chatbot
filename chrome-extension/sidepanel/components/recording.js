// Recording functionality for side panel

/**
 * Initialize recording functionality
 * @param {Object} params - Parameters for initialization
 * @param {Function} params.onRecordingComplete - Callback when recording is complete
 * @returns {Object} - Recording controller methods
 */
export function initRecording({ onRecordingComplete }) {
  // DOM elements
  const recordBtn = document.getElementById('recordBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const stopBtn = document.getElementById('stopBtn');
  const timerDisplay = document.querySelector('.timer');
  const recordingTitleInput = document.getElementById('recordingTitle');
  const pendingRecordingsList = document.getElementById('pendingRecordings');
  const waveformContainer = document.getElementById('waveformMini');
  
  // Recording variables
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
  let dataArray;
  let animationFrameId;
  
  // Load settings
  let settings = null;
  
  // Load settings on initialization
  loadSettings();

  // Event listeners
  recordBtn.addEventListener('click', startRecording);
  pauseBtn.addEventListener('click', pauseRecording);
  stopBtn.addEventListener('click', stopRecording);
  
  // Create waveform visualization
  createWaveformBars(waveformContainer);
  
  /**
   * Load extension settings
   */
  function loadSettings() {
    chrome.storage.local.get(['settings'], function(result) {
      if (result.settings) {
        settings = result.settings;
        MAX_RECORDING_MINUTES = settings.maxRecordingTime || 5;
      } else {
        settings = {
          platformUrl: 'http://localhost:3000',
          checkInterval: 60,
          maxRecordingTime: 5,
          showWaveform: true
        };
        chrome.storage.local.set({ settings });
      }
    });
  }
  
  /**
   * Start audio recording
   */
  function startRecording() {
    try {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          mediaRecorder = new MediaRecorder(stream);
          audioChunks = [];
          
          mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
          };
          
          mediaRecorder.onstop = saveRecording;
          
          mediaRecorder.start(1000); // Collect data every second
          isRecording = true;
          isPaused = false;
          
          startTimer();
          
          if (settings && settings.showWaveform) {
            setupAudioVisualization(stream);
          }
          
          recordBtn.disabled = true;
          pauseBtn.disabled = false;
          stopBtn.disabled = false;
        })
        .catch(error => {
          console.error('Error accessing microphone:', error);
          showRecordingError('Could not access microphone. Please check permissions.');
        });
    } catch (error) {
      console.error('Error starting recording:', error);
      showRecordingError('Error starting recording. Please try again.');
    }
  }
  
  /**
   * Pause/resume recording
   */
  function pauseRecording() {
    if (!mediaRecorder) return;
    
    if (isPaused) {
      mediaRecorder.resume();
      isPaused = false;
      pauseBtn.textContent = 'Pause';
      startTimer();
    } else {
      mediaRecorder.pause();
      isPaused = true;
      pauseBtn.textContent = 'Resume';
      clearInterval(recordingTimer);
    }
  }
  
  /**
   * Stop recording
   */
  function stopRecording() {
    if (!mediaRecorder) return;
    
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
    
    isRecording = false;
    isPaused = false;
    
    clearInterval(recordingTimer);
    
    recordBtn.disabled = false;
    pauseBtn.disabled = true;
    stopBtn.disabled = true;
    pauseBtn.textContent = 'Pause';
    
    // Cancel visualization if active
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    
    if (audioContext) {
      audioContext.close().catch(e => console.error('Error closing audio context:', e));
      audioContext = null;
    }
  }
  
  /**
   * Save the recorded audio
   */
  function saveRecording() {
    if (audioChunks.length === 0) return;
    
    const title = recordingTitleInput.value || 'Unnamed Recording';
    const timestamp = new Date().toISOString();
    
    const mimeType = mediaRecorder.mimeType || 'audio/webm';
    const audioBlob = new Blob(audioChunks, { type: mimeType });
    
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = function() {
      const base64Audio = reader.result;
      
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
          loadPendingRecordings();
          recordingTitleInput.value = '';
          resetTimer();
          
          // Trigger sync
          chrome.runtime.sendMessage({ action: 'syncNow' });
          
          // Call completion callback if provided
          if (typeof onRecordingComplete === 'function') {
            onRecordingComplete(newRecording);
          }
        });
      });
    };
  }
  
  /**
   * Load pending recordings from storage
   */
  function loadPendingRecordings() {
    chrome.storage.local.get(['pendingRecordings'], function(result) {
      const pendingRecordings = result.pendingRecordings || [];
      
      pendingRecordingsList.innerHTML = '';
      
      if (pendingRecordings.length === 0) {
        pendingRecordingsList.innerHTML = '<li class="empty-message">No pending recordings</li>';
        return;
      }
      
      pendingRecordings.forEach(recording => {
        const li = document.createElement('li');
        li.innerHTML = `
          <div class="item-title">${recording.title || 'Unnamed Recording'}</div>
          <div class="item-status">${recording.processed ? '<span class="processed">✓</span>' : '<span class="pending">⏱</span>'}</div>
          <div class="item-actions">
            <button class="play-btn" data-id="${recording.id}">Play</button>
            <button class="delete-btn" data-id="${recording.id}">Delete</button>
          </div>
        `;
        pendingRecordingsList.appendChild(li);
      });
      
      // Add event listeners to buttons
      pendingRecordingsList.querySelectorAll('.play-btn').forEach(btn => {
        btn.addEventListener('click', playRecording);
      });
      
      pendingRecordingsList.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', deleteRecording);
      });
    });
  }
  
  /**
   * Play a recording
   * @param {Event} event - Click event
   */
  function playRecording(event) {
    const recordingId = parseInt(event.target.dataset.id);
    
    chrome.storage.local.get(['pendingRecordings'], function(result) {
      const pendingRecordings = result.pendingRecordings || [];
      const recording = pendingRecordings.find(r => r.id === recordingId);
      
      if (recording) {
        const audio = new Audio(recording.audio);
        audio.play();
      }
    });
  }
  
  /**
   * Delete a recording
   * @param {Event} event - Click event
   */
  function deleteRecording(event) {
    const recordingId = parseInt(event.target.dataset.id);
    
    if (confirm('Are you sure you want to delete this recording?')) {
      chrome.storage.local.get(['pendingRecordings'], function(result) {
        const pendingRecordings = result.pendingRecordings || [];
        const updatedRecordings = pendingRecordings.filter(r => r.id !== recordingId);
        
        chrome.storage.local.set({ pendingRecordings: updatedRecordings }, function() {
          loadPendingRecordings();
        });
      });
    }
  }
  
  /**
   * Start the recording timer
   */
  function startTimer() {
    clearInterval(recordingTimer);
    recordingTimer = setInterval(updateTimer, 1000);
  }
  
  /**
   * Update the recording timer display
   */
  function updateTimer() {
    recordingSeconds++;
    if (recordingSeconds >= 60) {
      recordingSeconds = 0;
      recordingMinutes++;
    }
    
    timerDisplay.textContent = `${recordingMinutes.toString().padStart(2, '0')}:${recordingSeconds.toString().padStart(2, '0')}`;
    
    if (recordingMinutes >= MAX_RECORDING_MINUTES) {
      stopRecording();
      showRecordingError(`Recording stopped after ${MAX_RECORDING_MINUTES} minutes`);
    }
  }
  
  /**
   * Reset the recording timer
   */
  function resetTimer() {
    clearInterval(recordingTimer);
    recordingSeconds = 0;
    recordingMinutes = 0;
    timerDisplay.textContent = '00:00';
  }
  
  /**
   * Set up audio visualization
   * @param {MediaStream} stream - Audio stream
   */
  function setupAudioVisualization(stream) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioAnalyser = audioContext.createAnalyser();
      audioAnalyser.fftSize = 256;
      
      const mediaStreamSource = audioContext.createMediaStreamSource(stream);
      mediaStreamSource.connect(audioAnalyser);
      
      const bufferLength = audioAnalyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
      
      visualize();
    } catch (error) {
      console.error('Error setting up audio visualization:', error);
    }
  }
  
  /**
   * Visualize audio data in the waveform
   */
  function visualize() {
    if (!audioAnalyser) return;
    
    animationFrameId = requestAnimationFrame(visualize);
    
    audioAnalyser.getByteFrequencyData(dataArray);
    
    const waveformBars = document.querySelectorAll('.waveform-bar');
    const barCount = waveformBars.length;
    
    for (let i = 0; i < barCount; i++) {
      const index = Math.floor(i * dataArray.length / barCount);
      const value = dataArray[index];
      const height = (value / 255) * 100;
      waveformBars[i].style.height = `${Math.max(5, height)}%`;
    }
  }
  
  /**
   * Create waveform visualization bars
   * @param {HTMLElement} container - Container element
   */
  function createWaveformBars(container) {
    if (!container) return;
    
    container.innerHTML = '';
    
    const waveformInner = document.createElement('div');
    waveformInner.className = 'waveform-inner';
    container.appendChild(waveformInner);
    
    for (let i = 0; i < 50; i++) {
      const bar = document.createElement('div');
      bar.className = 'waveform-bar';
      waveformInner.appendChild(bar);
    }
  }
  
  /**
   * Show recording error
   * @param {string} message - Error message
   */
  function showRecordingError(message) {
    alert(message);
  }
  
  // Return public methods
  return {
    loadPendingRecordings,
    resetRecording: resetTimer,
    startRecording,
    stopRecording
  };
}
