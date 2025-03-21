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
  // Load settings first
  loadSettings(() => {
    // Check authentication status
    checkAuthStatus();
    
    // Login form
    const loginForm = document.getElementById('loginForm');
    const userInfo = document.getElementById('userInfo');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userEmail = document.getElementById('userEmail');
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    const loginError = document.getElementById('loginError');
    
    // Login button
    loginBtn.addEventListener('click', () => {
      const email = loginEmail.value.trim();
      const password = loginPassword.value;
      
      if (!email || !password) {
        loginError.textContent = 'Please enter both email and password';
        return;
      }
      
      loginBtn.disabled = true;
      loginBtn.textContent = 'Logging in...';
      loginError.textContent = '';
      
      chrome.runtime.sendMessage(
        { action: 'login', email, password }, 
        (response) => {
          loginBtn.disabled = false;
          loginBtn.textContent = 'Login';
          
          if (response && response.success) {
            // Update UI
            loginForm.style.display = 'none';
            userInfo.style.display = 'block';
            userEmail.textContent = email;
            
            // Clear form
            loginEmail.value = '';
            loginPassword.value = '';
            
            // Check platform status again
            checkWizzoStatus();
          } else {
            loginError.textContent = response?.error || 'Login failed';
          }
        }
      );
    });
    
    // Logout button
    logoutBtn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'logout' }, (response) => {
        if (response && response.success) {
          // Update UI
          loginForm.style.display = 'block';
          userInfo.style.display = 'none';
          userEmail.textContent = '';
          
          // Check platform status again
          checkWizzoStatus();
        }
      });
    });
    
    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove active class from all buttons and panes
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));
        
        // Add active class to clicked button and corresponding pane
        btn.classList.add('active');
        const tabId = btn.dataset.tab;
        document.getElementById(tabId).classList.add('active');
      });
    });
    
    // Audio recording
    const recordBtn = document.getElementById('recordBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    const openRecordBtn = document.getElementById('openRecordBtn');
    const timerDisplay = document.querySelector('.timer');
    const recordingTitle = document.getElementById('recordingTitle');
    const pendingRecordings = document.getElementById('pendingRecordings');
    const waveformMini = document.getElementById('waveformMini');
    
    // Create mini waveform bars
    if (waveformMini) {
      createWaveformBars(waveformMini);
    }
    
    // Text input
    const textTitle = document.getElementById('textTitle');
    const textContent = document.getElementById('textContent');
    const saveTextBtn = document.getElementById('saveTextBtn');
    const pendingTexts = document.getElementById('pendingTexts');
    
    // Notes
    const noteContent = document.getElementById('noteContent');
    const saveNoteBtn = document.getElementById('saveNoteBtn');
    const pendingNotes = document.getElementById('pendingNotes');
    
    // Status and app
    const statusIndicator = document.getElementById('status');
    const syncNowBtn = document.getElementById('syncNowBtn');
    const openAppBtn = document.getElementById('openAppBtn');
    
    // Check if Wizzo is running
    checkWizzoStatus();
    
    // Initialize lists
    loadPendingItems();
    
    // Recording functionality
    recordBtn.addEventListener('click', startRecording);
    pauseBtn.addEventListener('click', pauseRecording);
    stopBtn.addEventListener('click', stopRecording);
    openRecordBtn.addEventListener('click', openRecordingView);
    
    // Text functionality
    saveTextBtn.addEventListener('click', saveText);
    
    // Notes functionality
    saveNoteBtn.addEventListener('click', saveNote);
    
    // Open app
    openAppBtn.addEventListener('click', openWizzoApp);
    
    // Sync now button
    syncNowBtn.addEventListener('click', syncNow);
    
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'statusUpdate') {
        updateStatusDisplay(message.status, message.authenticated, message.email);
      } else if (message.action === 'refreshRecordings') {
        loadPendingRecordings();
      } else if (message.action === 'refreshTexts') {
        loadPendingTexts();
      } else if (message.action === 'refreshNotes') {
        loadPendingNotes();
      } else if (message.action === 'authUpdate') {
        checkAuthStatus();
      } else if (message.action === 'authRequired') {
        // Show authentication required message
        const loginError = document.getElementById('loginError');
        if (loginError) {
          loginError.textContent = message.message || 'Authentication required';
        }
        // Ensure login form is visible
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
          loginForm.style.display = 'block';
        }
        const userInfo = document.getElementById('userInfo');
        if (userInfo) {
          userInfo.style.display = 'none';
        }
      }
    });
  });
});

// Check authentication status
function checkAuthStatus() {
  chrome.runtime.sendMessage({ action: 'isAuthenticated' }, (response) => {
    const loginForm = document.getElementById('loginForm');
    const userInfo = document.getElementById('userInfo');
    const userEmail = document.getElementById('userEmail');
    
    if (response && response.authenticated) {
      // User is authenticated
      loginForm.style.display = 'none';
      userInfo.style.display = 'block';
      userEmail.textContent = response.email || 'Unknown';
    } else {
      // User is not authenticated
      loginForm.style.display = 'block';
      userInfo.style.display = 'none';
    }
  });
}

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
  
  // Create waveform inner container
  const waveformInner = document.createElement('div');
  waveformInner.className = 'waveform-inner';
  container.appendChild(waveformInner);
  
  // Create bars
  for (let i = 0; i < 50; i++) {
    const bar = document.createElement('div');
    bar.className = 'waveform-bar';
    waveformInner.appendChild(bar);
  }
}

// Check if Wizzo app is running
function checkWizzoStatus() {
  chrome.runtime.sendMessage({ action: 'getStatus' }, function(response) {
    if (response) {
      updateStatusDisplay(response.status);
      
      // Also get queue status
      chrome.runtime.sendMessage({ action: 'getQueueStatus' }, function(queueResponse) {
        if (queueResponse && queueResponse.queueLength > 0) {
          const statusEl = document.getElementById('status');
          if (statusEl) {
            statusEl.textContent += ` (${queueResponse.queueLength} pending)`;
          }
        }
      });
    }
  });
}

// Update the status display
function updateStatusDisplay(isOnline, isAuthenticated, email) {
  const statusIndicator = document.getElementById('status');
  const syncNowBtn = document.getElementById('syncNowBtn');
  
  if (isOnline) {
    statusIndicator.textContent = 'Online';
    statusIndicator.classList.add('online');
    syncNowBtn.classList.add('show');
    
    // Also update authentication display
    const loginForm = document.getElementById('loginForm');
    const userInfo = document.getElementById('userInfo');
    const userEmail = document.getElementById('userEmail');
    
    if (isAuthenticated) {
      loginForm.style.display = 'none';
      userInfo.style.display = 'block';
      userEmail.textContent = email || 'Unknown';
    } else {
      loginForm.style.display = 'block';
      userInfo.style.display = 'none';
    }
  } else {
    statusIndicator.textContent = 'Offline';
    statusIndicator.classList.remove('online');
    syncNowBtn.classList.remove('show');
  }
}

// Manually trigger sync
function syncNow() {
  const syncBtn = document.getElementById('syncNowBtn');
  syncBtn.textContent = 'Syncing...';
  syncBtn.disabled = true;
  
  chrome.runtime.sendMessage({ action: 'syncNow' }, function(response) {
    setTimeout(() => {
      syncBtn.textContent = 'Sync Now';
      syncBtn.disabled = false;
      
      // Refresh all lists
      loadPendingItems();
    }, 2000);
  });
}

// Open recording in a new tab
function openRecordingView() {
  chrome.tabs.create({ url: chrome.runtime.getURL('recordingView.html') });
}

// Start audio recording
async function startRecording() {
  try {
    // First try to capture tab audio if possible
    let stream = null;
    
    try {
      // First try to request tab capture permission
      if (!chrome.tabCapture) {
        throw new Error('Tab capture API not available');
      }
      
      // Check if we have permission
      const tabCapture = await chrome.tabCapture.capture({
        audio: true,
        video: false
      });
      
      if (tabCapture) {
        console.log('Successfully captured tab audio');
        
        // If tab capture is successful, get microphone audio too
        const micStream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
        
        // Combine the streams
        const audioContext = new AudioContext();
        const tabSource = audioContext.createMediaStreamSource(tabCapture);
        const micSource = audioContext.createMediaStreamSource(micStream);
        const destination = audioContext.createMediaStreamDestination();
        
        tabSource.connect(destination);
        micSource.connect(destination);
        
        stream = destination.stream;
      }
    } catch (err) {
      console.log('Tab capture not available:', err);
      // Tab capture failed, fall back to just microphone
    }
    
    // If tab capture failed, use just microphone
    if (!stream) {
      stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
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
    
    // Start visualization if enabled
    if (settings && settings.showWaveform !== false) {
      setupAudioVisualization(stream);
    }
    
    // Update UI
    document.getElementById('recordBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;
    document.getElementById('stopBtn').disabled = false;
    
  } catch (error) {
    console.error('Error starting recording:', error);
    
    // Show permission error alert
    showPermissionAlert();
  }
}

// Show permission alert
function showPermissionAlert() {
  // Check if alert already exists
  if (document.querySelector('.permission-alert')) return;
  
  // Create alert element
  const alert = document.createElement('div');
  alert.className = 'permission-alert';
  alert.innerHTML = `
    <h3>Microphone Access Required</h3>
    <p>Please allow microphone access to record audio. Click the camera icon in the address bar and enable the microphone.</p>
    <button id="dismissBtn">OK</button>
  `;
  
  // Add to body
  document.body.appendChild(alert);
  
  // Add dismiss handler
  document.getElementById('dismissBtn').addEventListener('click', () => {
    document.body.removeChild(alert);
  });
}

// Pause/resume recording
function pauseRecording() {
  if (!mediaRecorder) return;
  
  if (isPaused) {
    // Resume recording
    mediaRecorder.resume();
    isPaused = false;
    document.getElementById('pauseBtn').textContent = 'Pause';
    startTimer();
    
    // Resume visualization
    if (audioAnalyser) {
      visualize();
    }
  } else {
    // Pause recording
    mediaRecorder.pause();
    isPaused = true;
    document.getElementById('pauseBtn').textContent = 'Resume';
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
  
  // Reset waveform
  const waveformBars = document.querySelectorAll('.waveform-bar');
  waveformBars.forEach(bar => {
    bar.style.height = '5%';
  });
}

// Save the recording
function saveRecording() {
  if (audioChunks.length === 0) return;
  
  const title = document.getElementById('recordingTitle').value || 'Unnamed Recording';
  const timestamp = new Date().toISOString();
  
  // Use the correct mime type
  const mimeType = mediaRecorder.mimeType || 'audio/webm';
  const audioBlob = new Blob(audioChunks, { type: mimeType });
  
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
        // Update UI
        loadPendingRecordings();
        
        // Also save to disk
        const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = `wizzo_recording_${sanitizedTitle}_${Date.now()}.webm`;
        
        // Use the downloads API to save the file
        chrome.downloads.download({
          url: URL.createObjectURL(audioBlob),
          filename: filename,
          saveAs: false
        });
        
        // Reset form
        document.getElementById('recordingTitle').value = '';
        resetTimer();
        
        // Try to process immediately if online
        chrome.runtime.sendMessage({ action: 'syncNow' });
      });
    });
  };
}

// Save text input
function saveText() {
  const title = document.getElementById('textTitle').value;
  const content = document.getElementById('textContent').value;
  
  if (!title || !content) {
    alert('Please enter both title and content');
    return;
  }
  
  const timestamp = new Date().toISOString();
  
  // Save to Chrome storage
  chrome.storage.local.get(['pendingTexts'], function(result) {
    const pendingTexts = result.pendingTexts || [];
    pendingTexts.push({
      id: Date.now(),
      title: title,
      content: content,
      timestamp: timestamp,
      processed: false
    });
    
    chrome.storage.local.set({ pendingTexts: pendingTexts }, function() {
      // Update UI
      loadPendingTexts();
      
      // Reset form
      document.getElementById('textTitle').value = '';
      document.getElementById('textContent').value = '';
      
      // Try to process immediately if online
      chrome.runtime.sendMessage({ action: 'syncNow' });
    });
  });
}

// Save note
function saveNote() {
  const content = document.getElementById('noteContent').value;
  
  if (!content) {
    alert('Please enter note content');
    return;
  }
  
  const timestamp = new Date().toISOString();
  
  // Save to Chrome storage
  chrome.storage.local.get(['pendingNotes'], function(result) {
    const pendingNotes = result.pendingNotes || [];
    pendingNotes.push({
      id: Date.now(),
      content: content,
      timestamp: timestamp,
      processed: false
    });
    
    chrome.storage.local.set({ pendingNotes: pendingNotes }, function() {
      // Update UI
      loadPendingNotes();
      
      // Reset form
      document.getElementById('noteContent').value = '';
      
      // Try to process immediately if online
      chrome.runtime.sendMessage({ action: 'syncNow' });
    });
  });
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
  const timerDisplay = document.querySelector('.timer');
  timerDisplay.textContent = `${recordingMinutes.toString().padStart(2, '0')}:${recordingSeconds.toString().padStart(2, '0')}`;
  
  // Check if we've reached the limit
  if (recordingMinutes >= MAX_RECORDING_MINUTES) {
    stopRecording();
    alert(`Recording stopped after ${MAX_RECORDING_MINUTES} minutes`);
  }
}

function resetTimer() {
  clearInterval(recordingTimer);
  recordingSeconds = 0;
  recordingMinutes = 0;
  document.querySelector('.timer').textContent = '00:00';
}

// Load pending items
function loadPendingItems() {
  try {
    loadPendingRecordings();
    loadPendingTexts();
    loadPendingNotes();
    console.log('All pending items loaded successfully');
  } catch(error) {
    console.error('Error loading pending items:', error);
  }
}

// Load pending recordings
function loadPendingRecordings() {
  const pendingRecordingsList = document.getElementById('pendingRecordings');
  pendingRecordingsList.innerHTML = '';
  
  chrome.storage.local.get(['pendingRecordings'], function(result) {
    const pendingRecordings = result.pendingRecordings || [];
    
    if (pendingRecordings.length === 0) {
      pendingRecordingsList.innerHTML = '<li class="empty-message">No pending recordings</li>';
      return;
    }
    
    pendingRecordings.forEach(recording => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="item-title">${recording.title}</div>
        <div class="item-status">${recording.processed ? '<span class="processed">✓</span>' : '<span class="pending">⏱</span>'}</div>
        <div class="item-actions">
          <button class="play-btn" data-id="${recording.id}">Play</button>
          <button class="delete-btn" data-id="${recording.id}">Delete</button>
        </div>
      `;
      pendingRecordingsList.appendChild(li);
    });
    
    // Add event listeners
    pendingRecordingsList.querySelectorAll('.play-btn').forEach(btn => {
      btn.addEventListener('click', playRecording);
    });
    
    pendingRecordingsList.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', deleteRecording);
    });
  });
}

// Load pending texts
function loadPendingTexts() {
  const pendingTextsList = document.getElementById('pendingTexts');
  pendingTextsList.innerHTML = '';
  
  chrome.storage.local.get(['pendingTexts'], function(result) {
    const pendingTexts = result.pendingTexts || [];
    
    if (pendingTexts.length === 0) {
      pendingTextsList.innerHTML = '<li class="empty-message">No pending texts</li>';
      return;
    }
    
    pendingTexts.forEach(text => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="item-title">${text.title}</div>
        <div class="item-status">${text.processed ? '<span class="processed">✓</span>' : '<span class="pending">⏱</span>'}</div>
        <div class="item-actions">
          <button class="view-btn" data-id="${text.id}">View</button>
          <button class="delete-btn" data-id="${text.id}">Delete</button>
        </div>
      `;
      pendingTextsList.appendChild(li);
    });
    
    // Add event listeners
    pendingTextsList.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', viewText);
    });
    
    pendingTextsList.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', deleteText);
    });
  });
}

// Load pending notes
function loadPendingNotes() {
  const pendingNotesList = document.getElementById('pendingNotes');
  pendingNotesList.innerHTML = '';
  
  chrome.storage.local.get(['pendingNotes'], function(result) {
    const pendingNotes = result.pendingNotes || [];
    
    if (pendingNotes.length === 0) {
      pendingNotesList.innerHTML = '<li class="empty-message">No pending notes</li>';
      return;
    }
    
    pendingNotes.forEach(note => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="item-title">${note.content.substring(0, 30)}${note.content.length > 30 ? '...' : ''}</div>
        <div class="item-status">${note.processed ? '<span class="processed">✓</span>' : '<span class="pending">⏱</span>'}</div>
        <div class="item-actions">
          <button class="view-btn" data-id="${note.id}">View</button>
          <button class="delete-btn" data-id="${note.id}">Delete</button>
        </div>
      `;
      pendingNotesList.appendChild(li);
    });
    
    // Add event listeners
    pendingNotesList.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', viewNote);
    });
    
    pendingNotesList.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', deleteNote);
    });
  });
}

// Play recording
function playRecording(event) {
  const recordingId = parseInt(event.target.dataset.id);
  
  chrome.storage.local.get(['pendingRecordings'], function(result) {
    const pendingRecordings = result.pendingRecordings || [];
    const recording = pendingRecordings.find(r => r.id === recordingId);
    
    if (recording) {
      // Create an audio element and play
      const audio = new Audio(recording.audio);
      audio.play();
    }
  });
}

// Delete recording
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

// View text
function viewText(event) {
  const textId = parseInt(event.target.dataset.id);
  
  chrome.storage.local.get(['pendingTexts'], function(result) {
    const pendingTexts = result.pendingTexts || [];
    const text = pendingTexts.find(t => t.id === textId);
    
    if (text) {
      // Create a modal for viewing the text
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-content">
          <span class="close-modal">&times;</span>
          <h3>${text.title}</h3>
          <div class="text-content">${text.content.replace(/\n/g, '<br>')}</div>
        </div>
      `;
      document.body.appendChild(modal);
      
      // Close modal when clicking X
      modal.querySelector('.close-modal').addEventListener('click', () => {
        document.body.removeChild(modal);
      });
      
      // Close modal when clicking outside
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
        }
      });
    }
  });
}

// Delete text
function deleteText(event) {
  const textId = parseInt(event.target.dataset.id);
  
  if (confirm('Are you sure you want to delete this text?')) {
    chrome.storage.local.get(['pendingTexts'], function(result) {
      const pendingTexts = result.pendingTexts || [];
      const updatedTexts = pendingTexts.filter(t => t.id !== textId);
      
      chrome.storage.local.set({ pendingTexts: updatedTexts }, function() {
        loadPendingTexts();
      });
    });
  }
}

// View note
function viewNote(event) {
  const noteId = parseInt(event.target.dataset.id);
  
  chrome.storage.local.get(['pendingNotes'], function(result) {
    const pendingNotes = result.pendingNotes || [];
    const note = pendingNotes.find(n => n.id === noteId);
    
    if (note) {
      // Create a modal for viewing the note
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-content">
          <span class="close-modal">&times;</span>
          <h3>Note</h3>
          <div class="note-content">${note.content.replace(/\n/g, '<br>')}</div>
        </div>
      `;
      document.body.appendChild(modal);
      
      // Close modal when clicking X
      modal.querySelector('.close-modal').addEventListener('click', () => {
        document.body.removeChild(modal);
      });
      
      // Close modal when clicking outside
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
        }
      });
    }
  });
}

// Delete note
function deleteNote(event) {
  const noteId = parseInt(event.target.dataset.id);
  
  if (confirm('Are you sure you want to delete this note?')) {
    chrome.storage.local.get(['pendingNotes'], function(result) {
      const pendingNotes = result.pendingNotes || [];
      const updatedNotes = pendingNotes.filter(n => n.id !== noteId);
      
      chrome.storage.local.set({ pendingNotes: updatedNotes }, function() {
        loadPendingNotes();
      });
    });
  }
}

// Open Wizzo app
function openWizzoApp() {
  if (settings && settings.platformUrl) {
    chrome.tabs.create({ url: settings.platformUrl });
  } else {
    chrome.tabs.create({ url: 'http://localhost:3000' });
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
    
    // Connect the media stream to the analyzer
    const mediaStreamSource = audioContext.createMediaStreamSource(stream);
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

// Update waveform visualization
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