// Popup UI controller
document.addEventListener('DOMContentLoaded', function() {
  initPopup();
});

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

// Initialize the popup
async function initPopup() {
  showLoadingState();
  // Set a timeout to show error if loading takes too long
  const loadingTimeout = setTimeout(() => {
    // Check if loading state is still active
    if (document.getElementById('loadingState').style.display === 'flex') {
      // Show error and provide option to retry
      document.getElementById('loadingState').innerHTML = `
        <div class="error-state">
          <p>Something went wrong while loading the extension.</p>
          <p>This might be due to a connection issue.</p>
          <button id="retryButton" class="btn">Retry</button>
          <button id="debugButton" class="btn">Debug Info</button>
        </div>
      `;
      
      document.getElementById('retryButton').addEventListener('click', function() {
        window.location.reload();
      });
      
      document.getElementById('debugButton').addEventListener('click', function() {
        // Show debug information
        chrome.storage.local.get(['wizzo_debug', 'wizzo_error_log'], function(result) {
          const debugInfo = result.wizzo_debug || { error: 'No debug information available' };
          const errorLog = result.wizzo_error_log || [];
          
          const debugModal = document.createElement('div');
          debugModal.className = 'modal';
          debugModal.innerHTML = `
            <div class="modal-content">
              <span class="close-modal">&times;</span>
              <h3>Debug Information</h3>
              <pre>${JSON.stringify(debugInfo, null, 2)}</pre>
              <h3>Last 5 Errors</h3>
              <pre>${JSON.stringify(errorLog.slice(-5), null, 2)}</pre>
            </div>
          `;
          document.body.appendChild(debugModal);
          
          debugModal.querySelector('.close-modal').addEventListener('click', () => {
            document.body.removeChild(debugModal);
          });
        });
      });
    }
  }, 10000); // Show error after 10 seconds
  
  try {
    await loadSettings();
    setupTabs();
    await checkAuthStatus();
    setupEventListeners();
    await loadAllData();
    hideLoadingState();
    clearTimeout(loadingTimeout); // Clear timeout if successful
  } catch (error) {
    console.error('Error initializing popup:', error);
    // If an error occurred before timeout, show error immediately
    clearTimeout(loadingTimeout);
    
    document.getElementById('loadingState').innerHTML = `
      <div class="error-state">
        <p>Error loading extension: ${error.message}</p>
        <button id="retryButton" class="btn">Retry</button>
      </div>
    `;
    
    document.getElementById('retryButton').addEventListener('click', function() {
      window.location.reload();
    });
  }
}

// Load settings
async function loadSettings() {
  return new Promise(resolve => {
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
      resolve();
    });
  });
}

// Set up tab switching
function setupTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const tabId = btn.dataset.tab;
      document.getElementById(tabId).classList.add('active');
    });
  });
}

// Set up event listeners
function setupEventListeners() {
  // Login form
  document.getElementById('loginButton').addEventListener('click', handleLogin);
  document.getElementById('logoutButton').addEventListener('click', handleLogout);
  document.getElementById('openSignupLink').addEventListener('click', openSignupPage);
  
  // Widgets tab
  document.getElementById('syncButton').addEventListener('click', syncWidgets);
  document.getElementById('createWidgetButton').addEventListener('click', showWidgetForm);
  document.getElementById('saveWidgetButton').addEventListener('click', saveWidget);
  document.getElementById('cancelWidgetButton').addEventListener('click', hideWidgetForm);
  
  // Recordings tab
  document.getElementById('recordBtn').addEventListener('click', startRecording);
  document.getElementById('pauseBtn').addEventListener('click', pauseRecording);
  document.getElementById('stopBtn').addEventListener('click', stopRecording);
  
  // Notes tab
  document.getElementById('saveNoteBtn').addEventListener('click', saveNote);
  
  // Open Wizzo platform
  document.getElementById('openWizzoButton').addEventListener('click', openWizzoPlatform);
  
  // Initialize waveform
  if (settings && settings.showWaveform) {
    createWaveformBars(document.getElementById('waveformMini'));
  }
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener(handleBackgroundMessages);
}

// Load all data
async function loadAllData() {
  await Promise.all([
    loadWidgets(),
    loadPendingRecordings(),
    loadPendingNotes()
  ]);
}

// Check authentication status
async function checkAuthStatus() {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ action: 'checkAuth' }, (response) => {
      const loginForm = document.getElementById('loginForm');
      const mainContent = document.getElementById('mainContent');
      const userEmail = document.getElementById('userEmail');
      
      if (response && response.isAuthenticated) {
        loginForm.style.display = 'none';
        mainContent.style.display = 'block';
        userEmail.textContent = response.email || 'Unknown';
      } else {
        loginForm.style.display = 'block';
        mainContent.style.display = 'none';
      }
      resolve(response);
    });
  });
}

// Handle login
function handleLogin() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const loginError = document.getElementById('loginError');
  const loginButton = document.getElementById('loginButton');
  
  if (!email || !password) {
    loginError.textContent = 'Please enter both email and password';
    loginError.style.display = 'block';
    return;
  }
  
  loginButton.disabled = true;
  loginButton.textContent = 'Signing in...';
  loginError.style.display = 'none';
  
  chrome.runtime.sendMessage({ action: 'login', email, password }, (response) => {
    loginButton.disabled = false;
    loginButton.textContent = 'Sign In';
    
    if (response && response.success) {
      document.getElementById('loginForm').style.display = 'none';
      document.getElementById('mainContent').style.display = 'block';
      document.getElementById('userEmail').textContent = email;
      
      document.getElementById('email').value = '';
      document.getElementById('password').value = '';
      
      loadAllData();
    } else {
      loginError.textContent = response?.error || 'Login failed. Please check your credentials.';
      loginError.style.display = 'block';
    }
  });
}

// Handle logout
function handleLogout() {
  chrome.runtime.sendMessage({ action: 'logout' }, (response) => {
    if (response && response.success) {
      document.getElementById('loginForm').style.display = 'block';
      document.getElementById('mainContent').style.display = 'none';
      document.getElementById('userEmail').textContent = '';
    }
  });
}

// Open signup page
function openSignupPage() {
  if (settings && settings.platformUrl) {
    chrome.tabs.create({ url: `${settings.platformUrl}/signup` });
  } else {
    chrome.tabs.create({ url: 'https://wizzo.com/signup' });
  }
}

// Open Wizzo platform
function openWizzoPlatform() {
  if (settings && settings.platformUrl) {
    chrome.tabs.create({ url: settings.platformUrl });
  } else {
    chrome.tabs.create({ url: 'https://wizzo.com' });
  }
}

// Handle background messages
function handleBackgroundMessages(message) {
  if (message.action === 'statusUpdate') {
    updateSyncStatus(message.pendingChanges);
  } else if (message.action === 'authUpdate') {
    checkAuthStatus();
  }
}

// Load widgets
async function loadWidgets() {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ action: 'getWidgets' }, (response) => {
      if (response && response.success) {
        renderWidgets(response.widgets);
      } else {
        console.error('Failed to load widgets:', response?.error);
      }
      resolve();
    });
  });
}

// Render widgets
function renderWidgets(widgets) {
  const widgetsList = document.getElementById('widgetsList');
  const emptyState = document.getElementById('emptyWidgetsState');
  
  widgetsList.innerHTML = '';
  
  if (!widgets || widgets.length === 0) {
    emptyState.style.display = 'block';
    return;
  }
  
  emptyState.style.display = 'none';
  
  widgets.forEach(widget => {
    const widgetElement = document.createElement('div');
    widgetElement.className = 'widget-item';
    
    const isSynced = widget.syncedAt && new Date(widget.syncedAt) >= new Date(widget.updatedAt);
    const syncClass = isSynced ? 'synced' : 'unsynced';
    
    widgetElement.innerHTML = `
      <div class="widget-title">${widget.title || 'Untitled Widget'}</div>
      <div class="widget-meta">
        <span class="widget-type">${widget.type || 'Widget'}</span>
        <span class="sync-indicator ${syncClass}"></span>
      </div>
    `;
    
    widgetElement.addEventListener('click', () => {
      if (settings && settings.platformUrl) {
        chrome.tabs.create({ url: `${settings.platformUrl}/widget/${widget.id}` });
      } else {
        chrome.tabs.create({ url: `https://wizzo.com/widget/${widget.id}` });
      }
    });
    
    widgetsList.appendChild(widgetElement);
  });
  
  updateSyncStatus(widgets.filter(w => !w.syncedAt || new Date(w.updatedAt) > new Date(w.syncedAt)).length);
}

// Show widget form
function showWidgetForm() {
  document.getElementById('mainContent').style.display = 'none';
  document.getElementById('widgetForm').style.display = 'block';
}

// Hide widget form
function hideWidgetForm() {
  document.getElementById('widgetForm').style.display = 'none';
  document.getElementById('mainContent').style.display = 'block';
  
  document.getElementById('widgetTitle').value = '';
  document.getElementById('widgetType').selectedIndex = 0;
  document.getElementById('widgetColor').selectedIndex = 0;
  document.getElementById('widgetDescription').value = '';
}

// Save widget
function saveWidget() {
  const title = document.getElementById('widgetTitle').value;
  const type = document.getElementById('widgetType').value;
  const color = document.getElementById('widgetColor').value;
  const description = document.getElementById('widgetDescription').value;
  
  if (!title) {
    alert('Please enter a widget title');
    return;
  }
  
  const widget = {
    title,
    type,
    color,
    description,
    settings: {}
  };
  
  chrome.runtime.sendMessage({ action: 'addWidget', widget }, (response) => {
    if (response && response.success) {
      hideWidgetForm();
      loadWidgets();
      syncWidgets();
    } else {
      alert(`Failed to save widget: ${response?.error || 'Unknown error'}`);
    }
  });
}

// Sync widgets
function syncWidgets() {
  const syncButton = document.getElementById('syncButton');
  const syncStatusText = document.getElementById('syncStatusText');
  
  syncButton.disabled = true;
  syncStatusText.textContent = 'Syncing...';
  
  chrome.runtime.sendMessage({ action: 'syncData' }, (response) => {
    syncButton.disabled = false;
    
    if (response && response.success) {
      syncStatusText.textContent = 'All synced';
      loadWidgets();
    } else {
      syncStatusText.textContent = 'Sync failed';
      syncStatusText.className = 'sync-error';
      console.error('Sync failed:', response?.error);
    }
  });
}

// Update sync status
function updateSyncStatus(pendingChanges) {
  const syncStatusText = document.getElementById('syncStatusText');
  
  if (pendingChanges > 0) {
    syncStatusText.textContent = `${pendingChanges} pending changes`;
    syncStatusText.className = 'sync-needed';
  } else {
    syncStatusText.textContent = 'All synced';
    syncStatusText.className = '';
  }
}

// Load pending recordings
async function loadPendingRecordings() {
  return new Promise(resolve => {
    chrome.storage.local.get(['pendingRecordings'], function(result) {
      const pendingRecordings = result.pendingRecordings || [];
      const pendingRecordingsList = document.getElementById('pendingRecordings');
      
      pendingRecordingsList.innerHTML = '';
      
      if (pendingRecordings.length === 0) {
        pendingRecordingsList.innerHTML = '<li class="empty-message">No pending recordings</li>';
        resolve();
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
      
      pendingRecordingsList.querySelectorAll('.play-btn').forEach(btn => {
        btn.addEventListener('click', playRecording);
      });
      
      pendingRecordingsList.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', deleteRecording);
      });
      
      resolve();
    });
  });
}

// Load pending notes
async function loadPendingNotes() {
  return new Promise(resolve => {
    chrome.storage.local.get(['pendingNotes'], function(result) {
      const pendingNotes = result.pendingNotes || [];
      const pendingNotesList = document.getElementById('pendingNotes');
      
      pendingNotesList.innerHTML = '';
      
      if (pendingNotes.length === 0) {
        pendingNotesList.innerHTML = '<li class="empty-message">No pending notes</li>';
        resolve();
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
      
      pendingNotesList.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', viewNote);
      });
      
      pendingNotesList.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', deleteNote);
      });
      
      resolve();
    });
  });
}

// Recording functions
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
        
        document.getElementById('recordBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
        document.getElementById('stopBtn').disabled = false;
      })
      .catch(error => {
        console.error('Error accessing microphone:', error);
        alert('Could not access microphone. Please check permissions.');
      });
  } catch (error) {
    console.error('Error starting recording:', error);
    alert('Error starting recording. Please try again.');
  }
}

function pauseRecording() {
  if (!mediaRecorder) return;
  
  if (isPaused) {
    mediaRecorder.resume();
    isPaused = false;
    document.getElementById('pauseBtn').textContent = 'Pause';
    startTimer();
  } else {
    mediaRecorder.pause();
    isPaused = true;
    document.getElementById('pauseBtn').textContent = 'Resume';
    clearInterval(recordingTimer);
  }
}

function stopRecording() {
  if (!mediaRecorder) return;
  
  mediaRecorder.stop();
  mediaRecorder.stream.getTracks().forEach(track => track.stop());
  
  isRecording = false;
  isPaused = false;
  
  clearInterval(recordingTimer);
  
  document.getElementById('recordBtn').disabled = false;
  document.getElementById('pauseBtn').disabled = true;
  document.getElementById('stopBtn').disabled = true;
  document.getElementById('pauseBtn').textContent = 'Pause';
}

function saveRecording() {
  if (audioChunks.length === 0) return;
  
  const title = document.getElementById('recordingTitle').value || 'Unnamed Recording';
  const timestamp = new Date().toISOString();
  
  const mimeType = mediaRecorder.mimeType || 'audio/webm';
  const audioBlob = new Blob(audioChunks, { type: mimeType });
  
  const reader = new FileReader();
  reader.readAsDataURL(audioBlob);
  reader.onloadend = function() {
    const base64Audio = reader.result;
    
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
        loadPendingRecordings();
        document.getElementById('recordingTitle').value = '';
        resetTimer();
        chrome.runtime.sendMessage({ action: 'syncNow' });
      });
    });
  };
}

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
  
  const timerDisplay = document.querySelector('.timer');
  timerDisplay.textContent = `${recordingMinutes.toString().padStart(2, '0')}:${recordingSeconds.toString().padStart(2, '0')}`;
  
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

// Save note
function saveNote() {
  const content = document.getElementById('noteContent').value;
  
  if (!content) {
    alert('Please enter note content');
    return;
  }
  
  const timestamp = new Date().toISOString();
  
  chrome.storage.local.get(['pendingNotes'], function(result) {
    const pendingNotes = result.pendingNotes || [];
    pendingNotes.push({
      id: Date.now(),
      content: content,
      timestamp: timestamp,
      processed: false
    });
    
    chrome.storage.local.set({ pendingNotes: pendingNotes }, function() {
      loadPendingNotes();
      document.getElementById('noteContent').value = '';
      chrome.runtime.sendMessage({ action: 'syncNow' });
    });
  });
}

function viewNote(event) {
  const noteId = parseInt(event.target.dataset.id);
  
  chrome.storage.local.get(['pendingNotes'], function(result) {
    const pendingNotes = result.pendingNotes || [];
    const note = pendingNotes.find(n => n.id === noteId);
    
    if (note) {
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
      
      modal.querySelector('.close-modal').addEventListener('click', () => {
        document.body.removeChild(modal);
      });
      
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
        }
      });
    }
  });
}

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

// Helper functions
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

let audioContext;
let audioAnalyser;
let dataArray;
let animationFrameId;

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

// UI helper functions
function showLoadingState() {
  document.getElementById('loadingState').style.display = 'flex';
}

function hideLoadingState() {
  document.getElementById('loadingState').style.display = 'none';
}
