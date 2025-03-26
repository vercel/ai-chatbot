// Main side panel controller with modernized UI

/**
 * Hide login error message
 */
function hideLoginError() {
  const loginError = document.getElementById('loginError');
  if (loginError) {
    loginError.style.display = 'none';
  }
}
/**
 * Check for stored credentials and auto-login if available
 */
async function checkStoredCredentials() {
  return new Promise(resolve => {
    chrome.storage.local.get(['wizzo_stored_credentials'], function(result) {
      const credentials = result.wizzo_stored_credentials;
      
      if (credentials && credentials.email && credentials.password) {
        // Auto-fill the form
        document.getElementById('email').value = credentials.email;
        document.getElementById('password').value = credentials.password;
        document.getElementById('rememberMe').checked = true;
        
        // Auto-login
        document.getElementById('loginButton').click();
      } else {
        // Check if user is already logged in
        checkAuthStatus();
      }
      
      resolve();
    });
  });
}

/**
 * Store user credentials securely
 */
function storeCredentials(email, password) {
  chrome.storage.local.set({
    wizzo_stored_credentials: {
      email,
      password
    }
  });
}

/**
 * Clear stored credentials
 */
function clearStoredCredentials() {
  chrome.storage.local.remove(['wizzo_stored_credentials']);
}

/**
 * Set up color picker for widget form
 */
function setupColorPicker() {
  const colorOptions = document.querySelectorAll('.color-option');
  if (!colorOptions.length) return;

  const colorInput = document.getElementById('widgetColor');
  
  colorOptions.forEach(option => {
    option.addEventListener('click', () => {
      // Remove active class from all options
      colorOptions.forEach(opt => opt.classList.remove('active'));
      
      // Add active class to clicked option
      option.classList.add('active');
      
      // Update hidden input value
      if (colorInput) {
        colorInput.value = option.getAttribute('data-color');
      }
    });
  });
}

/**
 * Set up user avatar with initial from email
 */
function setupUserAvatar() {
  const userAvatar = document.getElementById('userAvatar');
  if (!userAvatar) return;

  userAvatar.addEventListener('click', toggleUserMenu);
}

/**
 * Update user avatar with initial from email
 */
function updateUserAvatar(email) {
  let initial = 'W';
  
  if (email && email.length > 0) {
    initial = email.charAt(0).toUpperCase();
  }
  
  // Set initial in avatar circles
  const avatarElements = document.querySelectorAll('.avatar-circle');
  avatarElements.forEach(avatar => {
    avatar.textContent = initial;
  });
  
  // Update user menu info if available
  const menuUserName = document.getElementById('menuUserName');
  const menuUserEmail = document.getElementById('menuUserEmail');
  
  if (menuUserName && menuUserEmail) {
    // Extract name from email (before @ symbol)
    let name = email.split('@')[0];
    // Capitalize first letter of each word
    name = name.split('.').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    
    menuUserName.textContent = name;
    menuUserEmail.textContent = email;
  }
}

/**
 * Toggle user menu visibility
 */
function toggleUserMenu() {
  const userMenu = document.getElementById('userMenu');
  if (!userMenu) return;
  
  if (userMenu.style.display === 'block') {
    userMenu.style.display = 'none';
  } else {
    userMenu.style.display = 'block';
  }
}
// Initialize side panel
document.addEventListener('DOMContentLoaded', function() {
  initSidePanel();
});

// Initialize side panel functionality
async function initSidePanel() {
  try {
    showLoadingState();
    
    // Set up basic functionality
    setupTabs();
    setupAuthUI();
    setupSyncUI();
    setupColorPicker();
    setupUserAvatar();

    // Check for stored credentials (remember me)
    await checkStoredCredentials();
    
    hideLoadingState();
    setupMessageListeners();
  } catch (error) {
    console.error('Error initializing side panel:', error);
    showErrorState(error.message);
  }
}

// Set up tab switching
function setupTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all tabs
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));
      
      // Add active class to selected tab
      btn.classList.add('active');
      const tabId = btn.dataset.tab;
      document.getElementById(tabId).classList.add('active');
    });
  });
}

// Set up authentication UI and listeners
function setupAuthUI() {
  const loginButton = document.getElementById('loginButton');
  const logoutButton = document.getElementById('logoutButton');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const openSignupLink = document.getElementById('openSignupLink');
  const rememberMeCheckbox = document.getElementById('rememberMe');
  const loginError = document.getElementById('loginError');

  // Login button
  loginButton.addEventListener('click', () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const rememberMe = rememberMeCheckbox.checked;
    
    console.log('Login attempt with email:', email);
    
    if (!email || !password) {
      showLoginError('Please enter both email and password');
      return;
    }
    
    loginButton.disabled = true;
    loginButton.querySelector('.spinner-container').style.display = 'flex';
    hideLoginError();
    
    chrome.runtime.sendMessage({ 
      action: 'login', 
      email, 
      password 
    }, response => {
      console.log('Login response:', response);
      loginButton.disabled = false;
      loginButton.querySelector('.spinner-container').style.display = 'none';
      
      if (response && response.success) {
        console.log('Login successful, updating UI...');
        // Store credentials if remember me is checked
        if (rememberMe) {
          storeCredentials(email, password);
        } else {
          clearStoredCredentials();
        }

        // Update user avatar
        updateUserAvatar(email);
        
        emailInput.value = '';
        passwordInput.value = '';
        
        // Show main content
        const loginView = document.getElementById('loginView');
        const mainView = document.getElementById('mainView');
        console.log('Elements found:', {
          loginView: !!loginView,
          mainView: !!mainView
        });
        
        loginView.style.display = 'none';
        mainView.style.display = 'flex';
        console.log('Display styles set:', {
          loginViewDisplay: loginView.style.display,
          mainViewDisplay: mainView.style.display
        });
        
        loadInitialData();
      } else {
        console.error('Login failed:', response?.error);
        showLoginError(response?.error || 'Login failed');
      }
    });
  });
  
  // Logout button
  logoutButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'logout' }, response => {
      if (response && response.success) {
        showLoginForm();
      }
    });
  });
  
  // Signup link
  openSignupLink.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://wizzo.com/signup' });
  });
  
  // Enter key support for login
  passwordInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
      loginButton.click();
    }
  });
}

// Set up sync UI and listeners
function setupSyncUI() {
  const syncButton = document.getElementById('syncButton');
  const connectionStatus = document.getElementById('connectionStatus');
  
  // Sync button
  syncButton.addEventListener('click', () => {
    syncButton.disabled = true;
    document.getElementById('syncStatusText').textContent = 'Syncing...';
    connectionStatus.textContent = 'Syncing';
    connectionStatus.className = 'connection-status syncing';
    
    chrome.runtime.sendMessage({ action: 'syncData' }, response => {
      syncButton.disabled = false;
      updateConnectionStatus();
      
      if (response && response.success) {
        document.getElementById('syncStatusText').textContent = 'All synced';
        loadInitialData();
      } else {
        document.getElementById('syncStatusText').textContent = 'Sync failed';
        document.getElementById('syncStatusText').className = 'sync-error';
      }
    });
  });
  
  // Connection status
  window.addEventListener('online', updateConnectionStatus);
  window.addEventListener('offline', updateConnectionStatus);
  updateConnectionStatus();
}

// Check authentication status
async function checkAuthStatus() {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ action: 'checkAuth' }, response => {
      if (response && response.isAuthenticated) {
        // Check if userEmail element exists before trying to set its content
        const userEmailElement = document.getElementById('userEmail');
        if (userEmailElement) {
          userEmailElement.textContent = response.email || 'User';
        }
        showMainContent();
      } else {
        showLoginForm();
      }
      resolve(response);
    });
  });
}

// Load initial data
async function loadInitialData() {
  // Get widgets
  chrome.runtime.sendMessage({ action: 'getWidgets' }, response => {
    if (response && response.success) {
      renderWidgets(response.widgets);
    }
  });
  
  // Load recordings
  loadRecordings();
  
  // Load notes
  loadNotes();
}

// Load and render recordings
function loadRecordings() {
  chrome.storage.local.get(['pendingRecordings'], function(result) {
    const pendingRecordings = result.pendingRecordings || [];
    const pendingRecordingsList = document.getElementById('pendingRecordings');
    
    pendingRecordingsList.innerHTML = pendingRecordings.length === 0 ? 
      '<li class="empty-message">No pending recordings</li>' : '';
    
    pendingRecordings.forEach(recording => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="item-title">${recording.title || 'Unnamed Recording'}</div>
        <div class="item-status">${recording.processed ? '<span class="processed">✓</span>' : '<span class="pending">⏱</span>'}</div>
        <div class="item-actions">
          <button class="delete-btn" data-id="${recording.id}">Delete</button>
        </div>
      `;
      pendingRecordingsList.appendChild(li);
    });
    
    // Add event listeners
    pendingRecordingsList.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', deleteRecording);
    });
  });
  
  // Setup recording controls
  setupRecordingControls();
}

// Load and render notes
function loadNotes() {
  chrome.storage.local.get(['pendingNotes'], function(result) {
    const pendingNotes = result.pendingNotes || [];
    const pendingNotesList = document.getElementById('pendingNotes');
    
    pendingNotesList.innerHTML = pendingNotes.length === 0 ? 
      '<li class="empty-message">No pending notes</li>' : '';
    
    pendingNotes.forEach(note => {
      const li = document.createElement('li');
      const previewContent = note.content.substring(0, 30) + (note.content.length > 30 ? '...' : '');
      
      li.innerHTML = `
        <div class="item-title">${previewContent}</div>
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
  
  // Setup note controls
  document.getElementById('saveNoteBtn').addEventListener('click', saveNote);
}

// Setup recording controls (simplified for non-audio permissions for now)
function setupRecordingControls() {
  const recordBtn = document.getElementById('recordBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const stopBtn = document.getElementById('stopBtn');
  
  // Create waveform visualization
  const waveformContainer = document.getElementById('waveformMini');
  if (waveformContainer) {
    waveformContainer.innerHTML = '';
    const waveformInner = document.createElement('div');
    waveformInner.className = 'waveform-inner';
    waveformContainer.appendChild(waveformInner);
    
    for (let i = 0; i < 50; i++) {
      const bar = document.createElement('div');
      bar.className = 'waveform-bar';
      bar.style.height = '5%';
      waveformInner.appendChild(bar);
    }
  }
  
  let isRecording = false;
  let timerInterval = null;
  let seconds = 0;
  let minutes = 0;
  
  recordBtn.addEventListener('click', () => {
    isRecording = true;
    recordBtn.disabled = true;
    pauseBtn.disabled = false;
    stopBtn.disabled = false;
    
    // Start timer
    timerInterval = setInterval(() => {
      seconds++;
      if (seconds >= 60) {
        seconds = 0;
        minutes++;
      }
      document.querySelector('.timer').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
  });
  
  stopBtn.addEventListener('click', () => {
    // Stop recording simulation
    clearInterval(timerInterval);
    isRecording = false;
    recordBtn.disabled = false;
    pauseBtn.disabled = true;
    stopBtn.disabled = true;
    
    // Reset timer display
    document.querySelector('.timer').textContent = '00:00';
    
    // Mock save recording
    const title = document.getElementById('recordingTitle').value || 'Unnamed Recording';
    saveRecordingMock(title);
  });
}

// Mock function to save a recording
function saveRecordingMock(title) {
  const newRecording = {
    id: Date.now(),
    title: title,
    timestamp: new Date().toISOString(),
    processed: false
  };
  
  chrome.storage.local.get(['pendingRecordings'], function(result) {
    const pendingRecordings = result.pendingRecordings || [];
    pendingRecordings.push(newRecording);
    
    chrome.storage.local.set({ pendingRecordings: pendingRecordings }, function() {
      document.getElementById('recordingTitle').value = '';
      loadRecordings();
    });
  });
}

// Save a note
function saveNote() {
  const content = document.getElementById('noteContent').value.trim();
  
  if (!content) {
    alert('Please enter note content');
    return;
  }
  
  const newNote = {
    id: Date.now(),
    content: content,
    timestamp: new Date().toISOString(),
    processed: false
  };
  
  chrome.storage.local.get(['pendingNotes'], function(result) {
    const pendingNotes = result.pendingNotes || [];
    pendingNotes.push(newNote);
    
    chrome.storage.local.set({ pendingNotes: pendingNotes }, function() {
      document.getElementById('noteContent').value = '';
      loadNotes();
    });
  });
}

// View a note
function viewNote(event) {
  const noteId = parseInt(event.target.dataset.id);
  
  chrome.storage.local.get(['pendingNotes'], function(result) {
    const note = (result.pendingNotes || []).find(n => n.id === noteId);
    
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
    }
  });
}

// Delete a note
function deleteNote(event) {
  if (confirm('Delete this note?')) {
    const noteId = parseInt(event.target.dataset.id);
    chrome.storage.local.get(['pendingNotes'], function(result) {
      const pendingNotes = result.pendingNotes || [];
      const updatedNotes = pendingNotes.filter(n => n.id !== noteId);
      
      chrome.storage.local.set({ pendingNotes: updatedNotes }, function() {
        loadNotes();
      });
    });
  }
}

// Delete a recording
function deleteRecording(event) {
  if (confirm('Delete this recording?')) {
    const recordingId = parseInt(event.target.dataset.id);
    chrome.storage.local.get(['pendingRecordings'], function(result) {
      const pendingRecordings = result.pendingRecordings || [];
      const updatedRecordings = pendingRecordings.filter(r => r.id !== recordingId);
      
      chrome.storage.local.set({ pendingRecordings: updatedRecordings }, function() {
        loadRecordings();
      });
    });
  }
}

// Render widgets
function renderWidgets(widgets) {
  const widgetsList = document.getElementById('widgetsList');
  const emptyState = document.getElementById('emptyWidgetsState');
  
  if (!widgets || widgets.length === 0) {
    emptyState.style.display = 'block';
    widgetsList.innerHTML = '';
    return;
  }
  
  emptyState.style.display = 'none';
  widgetsList.innerHTML = '';
  
  widgets.forEach(widget => {
    const widgetElement = document.createElement('div');
    widgetElement.className = 'widget-item';
    
    widgetElement.innerHTML = `
      <div class="widget-title">${widget.title || 'Untitled Widget'}</div>
      <div class="widget-meta">
        <span class="widget-type">${widget.type || 'Widget'}</span>
      </div>
    `;
    
    widgetElement.addEventListener('click', () => {
      chrome.tabs.create({ url: `https://wizzo.com/widget/${widget.id}` });
    });
    
    widgetsList.appendChild(widgetElement);
  });
}

// Set up message listeners
function setupMessageListeners() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'authUpdate') {
      checkAuthStatus();
    } else if (message.action === 'syncComplete') {
      loadInitialData();
      document.getElementById('syncStatusText').textContent = 'All synced';
      updateConnectionStatus();
    }
    return true;
  });
  
  // Set up widget creation
  document.getElementById('createWidgetButton').addEventListener('click', () => {
    document.getElementById('mainView').style.display = 'none';
    document.getElementById('widgetForm').style.display = 'block';
  });
  
  document.getElementById('cancelWidgetButton').addEventListener('click', () => {
    document.getElementById('widgetForm').style.display = 'none';
    document.getElementById('mainView').style.display = 'flex';
  });
  
  document.getElementById('saveWidgetButton').addEventListener('click', saveWidget);
  
  document.getElementById('openWizzoButton').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://wizzo.com' });
  });
}

// Save widget
function saveWidget() {
  const title = document.getElementById('widgetTitle').value.trim();
  
  if (!title) {
    alert('Please enter a widget title');
    return;
  }
  
  const widget = {
    title,
    type: document.getElementById('widgetType').value,
    color: document.getElementById('widgetColor').value,
    description: document.getElementById('widgetDescription').value
  };
  
  chrome.runtime.sendMessage({ action: 'addWidget', widget }, response => {
    if (response && response.success) {
      document.getElementById('widgetForm').style.display = 'none';
      document.getElementById('mainView').style.display = 'flex';
      loadInitialData();
    } else {
      alert('Failed to save widget');
    }
  });
}

// Update connection status
function updateConnectionStatus() {
  const connectionStatus = document.getElementById('connectionStatus');
  
  if (navigator.onLine) {
    connectionStatus.textContent = 'Online';
    connectionStatus.className = 'connection-status online';
  } else {
    connectionStatus.textContent = 'Offline';
    connectionStatus.className = 'connection-status offline';
  }
}

// UI helper functions
function showLoginError(message) {
  const loginError = document.getElementById('loginError');
  loginError.textContent = message;
  loginError.style.display = 'block';
}

function showLoginForm() {
  document.getElementById('loginView').style.display = 'block';
  document.getElementById('mainView').style.display = 'none';
}

function showMainContent() {
  document.getElementById('loginView').style.display = 'none';
  document.getElementById('mainView').style.display = 'flex';
}

function showLoadingState() {
  document.getElementById('loadingState').style.display = 'flex';
}

function hideLoadingState() {
  document.getElementById('loadingState').style.display = 'none';
}

function showErrorState(message) {
  document.getElementById('loadingState').style.display = 'flex';
  document.getElementById('loadingState').innerHTML = `
    <div class="error-state">
      <p>Error: ${message || 'Something went wrong'}</p>
      <button id="retryButton" class="btn">Retry</button>
    </div>
  `;
  
  document.getElementById('retryButton').addEventListener('click', function() {
    window.location.reload();
  });
}
