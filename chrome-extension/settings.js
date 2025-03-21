// Default settings
const DEFAULT_SETTINGS = {
  platformUrl: 'http://localhost:3000',
  checkInterval: 60,  // seconds
  maxRecordingTime: 5, // minutes
  showWaveform: true
};

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
  const platformUrlInput = document.getElementById('platformUrl');
  const checkIntervalInput = document.getElementById('checkInterval');
  const maxRecordingTimeInput = document.getElementById('maxRecordingTime');
  const showWaveformCheckbox = document.getElementById('showWaveform');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const resetSettingsBtn = document.getElementById('resetSettingsBtn');
  const clearDataBtn = document.getElementById('clearDataBtn');
  
  // Load current settings
  loadSettings();
  
  // Event listeners
  saveSettingsBtn.addEventListener('click', saveSettings);
  resetSettingsBtn.addEventListener('click', resetSettings);
  clearDataBtn.addEventListener('click', clearAllData);
  
  // Load settings from storage
  function loadSettings() {
    chrome.storage.local.get(['settings'], function(result) {
      const settings = result.settings || DEFAULT_SETTINGS;
      
      // Fill form with settings
      platformUrlInput.value = settings.platformUrl;
      checkIntervalInput.value = settings.checkInterval;
      maxRecordingTimeInput.value = settings.maxRecordingTime;
      showWaveformCheckbox.checked = settings.showWaveform;
    });
  }
  
  // Save settings to storage
  function saveSettings() {
    const settings = {
      platformUrl: platformUrlInput.value.trim() || DEFAULT_SETTINGS.platformUrl,
      checkInterval: parseInt(checkIntervalInput.value) || DEFAULT_SETTINGS.checkInterval,
      maxRecordingTime: parseInt(maxRecordingTimeInput.value) || DEFAULT_SETTINGS.maxRecordingTime,
      showWaveform: showWaveformCheckbox.checked
    };
    
    // Validate URL
    if (!settings.platformUrl.startsWith('http://') && !settings.platformUrl.startsWith('https://')) {
      settings.platformUrl = 'http://' + settings.platformUrl;
    }
    
    // Ensure minimum values
    settings.checkInterval = Math.max(10, settings.checkInterval);
    settings.maxRecordingTime = Math.max(1, Math.min(30, settings.maxRecordingTime));
    
    // Save to storage
    chrome.storage.local.set({ settings }, function() {
      // Show save confirmation
      showToast('Settings saved successfully!');
      
      // Update the form values
      platformUrlInput.value = settings.platformUrl;
      checkIntervalInput.value = settings.checkInterval;
      maxRecordingTimeInput.value = settings.maxRecordingTime;
      
      // Notify background script about settings change
      chrome.runtime.sendMessage({ action: 'settingsUpdated', settings });
    });
  }
  
  // Reset settings to defaults
  function resetSettings() {
    if (confirm('Reset all settings to default values?')) {
      // Save default settings
      chrome.storage.local.set({ settings: DEFAULT_SETTINGS }, function() {
        // Reload form values
        loadSettings();
        
        // Show confirmation
        showToast('Settings reset to defaults');
        
        // Notify background script
        chrome.runtime.sendMessage({ action: 'settingsUpdated', settings: DEFAULT_SETTINGS });
      });
    }
  }
  
  // Clear all pending data
  function clearAllData() {
    if (confirm('Are you sure you want to clear all pending recordings, texts, and notes? This cannot be undone.')) {
      chrome.storage.local.get(['pendingRecordings', 'pendingTexts', 'pendingNotes'], function(result) {
        // Count items
        const recordingsCount = (result.pendingRecordings || []).length;
        const textsCount = (result.pendingTexts || []).length;
        const notesCount = (result.pendingNotes || []).length;
        const totalCount = recordingsCount + textsCount + notesCount;
        
        // Clear all data
        chrome.storage.local.set({
          pendingRecordings: [],
          pendingTexts: [],
          pendingNotes: []
        }, function() {
          showToast(`Cleared ${totalCount} pending items`);
          
          // Notify background script
          chrome.runtime.sendMessage({ action: 'dataCleared' });
        });
      });
    }
  }
  
  // Show toast notification
  function showToast(message) {
    // Create toast element if it doesn't exist
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
      
      // Add CSS for toast
      const style = document.createElement('style');
      style.textContent = `
        .toast {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background-color: #333;
          color: white;
          padding: 10px 20px;
          border-radius: 4px;
          font-size: 14px;
          opacity: 0;
          transition: opacity 0.3s;
          z-index: 1000;
        }
        
        .toast.show {
          opacity: 1;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Set message and show toast
    toast.textContent = message;
    toast.classList.add('show');
    
    // Hide toast after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
});