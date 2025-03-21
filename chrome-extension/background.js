// Background script for Wizzo Assistant

// Default settings
const DEFAULT_SETTINGS = {
  platformUrl: 'http://localhost:3000',
  checkInterval: 60,  // seconds
  maxRecordingTime: 5, // minutes
  showWaveform: true
};

// State
let platformStatus = false;
let checkInterval;
let retryInterval;
let processingQueue = [];
let settings = DEFAULT_SETTINGS;

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Wizzo Assistant installed');
  
  // Initialize storage if needed
  chrome.storage.local.get(['pendingRecordings', 'pendingTexts', 'pendingNotes', 'settings'], function(result) {
    if (!result.pendingRecordings) chrome.storage.local.set({ pendingRecordings: [] });
    if (!result.pendingTexts) chrome.storage.local.set({ pendingTexts: [] });
    if (!result.pendingNotes) chrome.storage.local.set({ pendingNotes: [] });
    
    // Load or initialize settings
    settings = result.settings || DEFAULT_SETTINGS;
    chrome.storage.local.set({ settings });
    
    // Start checking for platform status
    checkWizzoPlatform();
    startPeriodicChecks();
  });
});

// Function to start periodic checks
function startPeriodicChecks() {
  // Clear any existing intervals
  if (checkInterval) clearInterval(checkInterval);
  if (retryInterval) clearInterval(retryInterval);
  
  // Set up new intervals
  checkInterval = setInterval(checkWizzoPlatform, settings.checkInterval * 1000);
  retryInterval = setInterval(retryFailedItems, 300000); // Retry every 5 minutes
}

// Function to check if Wizzo is running
function checkWizzoPlatform() {
  fetch(`${settings.platformUrl}/api/status`, { 
    method: 'GET',
    headers: { 'Cache-Control': 'no-cache' },
    mode: 'no-cors' // This allows requests to work even with CORS issues
  })
    .then(response => {
      // If we get here, the server is probably running
      platformStatus = true;
      console.log('Wizzo platform is online');
      
      // If platform is running, sync any pending items
      syncPendingItems();
      
      // Broadcast status to any open popup
      chrome.runtime.sendMessage({ action: 'statusUpdate', status: true });
    })
    .catch(error => {
      // If fetch fails, the server is likely offline
      console.error('Error checking platform status:', error);
      platformStatus = false;
      chrome.runtime.sendMessage({ action: 'statusUpdate', status: false });
    });
}

// Function to retry failed processing items
function retryFailedItems() {
  if (!platformStatus || processingQueue.length === 0) return;
  
  console.log(`Retrying ${processingQueue.length} failed items`);
  
  // Process each item in the queue
  const itemsToRetry = [...processingQueue];
  processingQueue = [];
  
  itemsToRetry.forEach(item => {
    if (item.retries >= 3) {
      console.log(`Item ${item.id} has exceeded maximum retries and will be skipped`);
      return;
    }
    
    // Increment retry count
    item.retries += 1;
    
    // Process based on type
    switch (item.type) {
      case 'recording':
        processRecording(item.data, true);
        break;
      case 'text':
        processText(item.data, true);
        break;
      case 'note':
        processNote(item.data, true);
        break;
    }
  });
}

// Function to sync pending items with the platform
function syncPendingItems() {
  // Always save to offline-temp-files, regardless of platform status
  saveItemsToOfflineStorage();
  
  // Only proceed with online sync if platform is available
  if (!platformStatus) {
    console.log('Cannot sync online: platform is offline, but items were saved to offline storage');
    return;
  }
  
  console.log('Starting sync of pending items');
  
  // Get all pending items
  chrome.storage.local.get(['pendingRecordings', 'pendingTexts', 'pendingNotes'], function(result) {
    const pendingRecordings = result.pendingRecordings || [];
    const pendingTexts = result.pendingTexts || [];
    const pendingNotes = result.pendingNotes || [];
    
    const unprocessedRecordings = pendingRecordings.filter(r => !r.processed);
    const unprocessedTexts = pendingTexts.filter(t => !t.processed);
    const unprocessedNotes = pendingNotes.filter(n => !n.processed);
    
    console.log(`Found ${unprocessedRecordings.length} recordings, ${unprocessedTexts.length} texts, and ${unprocessedNotes.length} notes to process`);
    
    // Process recordings
    unprocessedRecordings.forEach(recording => processRecording(recording));
    
    // Process texts
    unprocessedTexts.forEach(text => processText(text));
    
    // Process notes
    unprocessedNotes.forEach(note => processNote(note));
  });
}

// Process a single recording
function processRecording(recording, isRetry = false) {
  console.log(`Processing recording: ${recording.title}`);
  
  fetch(`${settings.platformUrl}/api/recordings/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id: recording.id,
      title: recording.title,
      timestamp: recording.timestamp,
      audio: recording.audio
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    if (data.success) {
      // Mark as processed
      updateRecordingStatus(recording.id, true);
      console.log(`Recording ${recording.id} processed successfully`);
      
      // Notify user
      showNotification('Recording Processed', `Recording "${recording.title}" has been processed`);
    } else {
      throw new Error(data.error || 'Unknown error');
    }
  })
  .catch(error => {
    console.error(`Error processing recording ${recording.id}:`, error);
    
    // Add to retry queue if not already a retry
    if (!isRetry) {
      processingQueue.push({ 
        id: recording.id, 
        type: 'recording', 
        data: recording, 
        retries: 0 
      });
      
      // Show error notification
      showNotification('Processing Error', `Failed to process recording "${recording.title}". Will retry later.`);
    }
  });
}

// Process a single text
function processText(text, isRetry = false) {
  console.log(`Processing text: ${text.title}`);
  
  fetch(`${settings.platformUrl}/api/texts/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id: text.id,
      title: text.title,
      content: text.content,
      timestamp: text.timestamp
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    if (data.success) {
      // Mark as processed
      updateTextStatus(text.id, true);
      console.log(`Text ${text.id} processed successfully`);
      
      // Notify user
      showNotification('Text Processed', `Text "${text.title}" has been processed`);
    } else {
      throw new Error(data.error || 'Unknown error');
    }
  })
  .catch(error => {
    console.error(`Error processing text ${text.id}:`, error);
    
    // Add to retry queue if not already a retry
    if (!isRetry) {
      processingQueue.push({ 
        id: text.id, 
        type: 'text', 
        data: text, 
        retries: 0 
      });
      
      // Show error notification
      showNotification('Processing Error', `Failed to process text "${text.title}". Will retry later.`);
    }
  });
}

// Process a single note
function processNote(note, isRetry = false) {
  console.log(`Processing note: ${note.id}`);
  
  fetch(`${settings.platformUrl}/api/notes/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id: note.id,
      content: note.content,
      timestamp: note.timestamp
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    if (data.success) {
      // Mark as processed
      updateNoteStatus(note.id, true);
      console.log(`Note ${note.id} processed successfully`);
      
      // Notify user
      showNotification('Note Processed', `Note has been added to your knowledge base`);
    } else {
      throw new Error(data.error || 'Unknown error');
    }
  })
  .catch(error => {
    console.error(`Error processing note ${note.id}:`, error);
    
    // Add to retry queue if not already a retry
    if (!isRetry) {
      processingQueue.push({ 
        id: note.id, 
        type: 'note', 
        data: note, 
        retries: 0 
      });
      
      // Show error notification
      showNotification('Processing Error', `Failed to process note. Will retry later.`);
    }
  });
}

// Show notification
function showNotification(title, message) {
  // Check if we have permission first
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body: message,
      icon: 'icons/icon128.png'
    });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification(title, {
          body: message,
          icon: 'icons/icon128.png'
        });
      }
    });
  }
}

// Update recording status
function updateRecordingStatus(id, processed) {
  chrome.storage.local.get(['pendingRecordings'], function(result) {
    const pendingRecordings = result.pendingRecordings || [];
    const updatedRecordings = pendingRecordings.map(recording => {
      if (recording.id === id) {
        return { ...recording, processed };
      }
      return recording;
    });
    
    chrome.storage.local.set({ pendingRecordings: updatedRecordings });
    
    // Notify popup to refresh
    chrome.runtime.sendMessage({ action: 'refreshRecordings' });
  });
}

// Update text status
function updateTextStatus(id, processed) {
  chrome.storage.local.get(['pendingTexts'], function(result) {
    const pendingTexts = result.pendingTexts || [];
    const updatedTexts = pendingTexts.map(text => {
      if (text.id === id) {
        return { ...text, processed };
      }
      return text;
    });
    
    chrome.storage.local.set({ pendingTexts: updatedTexts });
    
    // Notify popup to refresh
    chrome.runtime.sendMessage({ action: 'refreshTexts' });
  });
}

// Update note status
function updateNoteStatus(id, processed) {
  chrome.storage.local.get(['pendingNotes'], function(result) {
    const pendingNotes = result.pendingNotes || [];
    const updatedNotes = pendingNotes.map(note => {
      if (note.id === id) {
        return { ...note, processed };
      }
      return note;
    });
    
    chrome.storage.local.set({ pendingNotes: updatedNotes });
    
    // Notify popup to refresh
    chrome.runtime.sendMessage({ action: 'refreshNotes' });
  });
}

// Function to save items to offline storage
function saveItemsToOfflineStorage() {
  console.log('Saving items to offline storage');
  
  // Get all pending items
  chrome.storage.local.get(['pendingRecordings', 'pendingTexts', 'pendingNotes'], function(result) {
    const pendingRecordings = result.pendingRecordings || [];
    const pendingTexts = result.pendingTexts || [];
    const pendingNotes = result.pendingNotes || [];
    
    const unprocessedRecordings = pendingRecordings.filter(r => !r.processed);
    const unprocessedTexts = pendingTexts.filter(t => !t.processed);
    const unprocessedNotes = pendingNotes.filter(n => !n.processed);
    
    console.log(`Found ${unprocessedRecordings.length} recordings, ${unprocessedTexts.length} texts, and ${unprocessedNotes.length} notes to save to offline storage`);
    
    // Save recordings to offline temp storage
    unprocessedRecordings.forEach(recording => {
      const offlineData = {
        id: recording.id,
        title: recording.title || 'Unnamed Recording',
        timestamp: recording.timestamp,
        audio: recording.audio,
        source: 'chrome_extension',
        processed: false,
        processingError: null,
        type: 'recording'
      };
      
      fetch(`${settings.platformUrl}/api/extension/save-offline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(offlineData)
      }).catch(error => {
        console.log('Error saving recording to offline storage (expected if offline):', error.message);
        // We expect this to fail when offline, which is okay
      });
    });
    
    // Save texts to offline temp storage
    unprocessedTexts.forEach(text => {
      const offlineData = {
        id: text.id,
        title: text.title || 'Unnamed Text',
        content: text.content,
        timestamp: text.timestamp,
        source: 'chrome_extension',
        processed: false,
        processingError: null,
        type: 'text'
      };
      
      fetch(`${settings.platformUrl}/api/extension/save-offline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(offlineData)
      }).catch(error => {
        console.log('Error saving text to offline storage (expected if offline):', error.message);
        // We expect this to fail when offline, which is okay
      });
    });
    
    // Save notes to offline temp storage
    unprocessedNotes.forEach(note => {
      const offlineData = {
        id: note.id,
        content: note.content,
        timestamp: note.timestamp,
        source: 'chrome_extension',
        processed: false,
        processingError: null,
        type: 'note'
      };
      
      fetch(`${settings.platformUrl}/api/extension/save-offline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(offlineData)
      }).catch(error => {
        console.log('Error saving note to offline storage (expected if offline):', error.message);
        // We expect this to fail when offline, which is okay
      });
    });
  });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'getStatus':
      sendResponse({ status: platformStatus });
      break;
      
    case 'checkNow':
      checkWizzoPlatform();
      sendResponse({ status: 'checking' });
      break;
      
    case 'syncNow':
      if (platformStatus) {
        syncPendingItems();
        sendResponse({ status: 'syncing' });
      } else {
        sendResponse({ status: 'offline' });
      }
      break;
      
    case 'getQueueStatus':
      sendResponse({ 
        queueLength: processingQueue.length,
        platformStatus
      });
      break;
      
    case 'settingsUpdated':
      // Update settings
      settings = message.settings;
      // Restart checking intervals with new settings
      startPeriodicChecks();
      // Force an immediate check
      checkWizzoPlatform();
      sendResponse({ status: 'settings_updated' });
      break;
      
    case 'dataCleared':
      // Clear processing queue as well
      processingQueue = [];
      sendResponse({ status: 'data_cleared' });
      break;
      
    case 'getSettings':
      sendResponse({ settings });
      break;
  }
  return true;
});