// Settings Controller
document.addEventListener('DOMContentLoaded', function() {
  // Load settings
  loadSettings();
  
  // Set up event listeners
  document.getElementById('saveBtn').addEventListener('click', saveSettings);
  document.getElementById('cancelBtn').addEventListener('click', () => window.close());
  document.getElementById('clearDataBtn').addEventListener('click', clearAllData);
  document.getElementById('viewLogsBtn').addEventListener('click', viewLogs);
});

// Load settings from storage
function loadSettings() {
  chrome.storage.local.get(['settings'], function(result) {
    const settings = result.settings || {
      platformUrl: 'http://localhost:3000',
      checkInterval: 60,
      maxRecordingTime: 5,
      showWaveform: true
    };
    
    // Update form values
    document.getElementById('platformUrl').value = settings.platformUrl;
    document.getElementById('syncInterval').value = settings.checkInterval;
    document.getElementById('maxRecordingTime').value = settings.maxRecordingTime;
    document.getElementById('showWaveform').checked = settings.showWaveform;
  });
}

// Save settings to storage
function saveSettings() {
  const settings = {
    platformUrl: document.getElementById('platformUrl').value,
    checkInterval: parseInt(document.getElementById('syncInterval').value) || 60,
    maxRecordingTime: parseInt(document.getElementById('maxRecordingTime').value) || 5,
    showWaveform: document.getElementById('showWaveform').checked
  };
  
  chrome.storage.local.set({ settings }, function() {
    alert('Settings saved successfully');
    window.close();
  });
}

// Clear all local data
function clearAllData() {
  if (confirm('Are you sure you want to clear all local data? This cannot be undone.')) {
    chrome.storage.local.remove(['pendingRecordings', 'pendingTexts', 'pendingNotes'], function() {
      alert('All data has been cleared');
      
      // Optionally notify background script to update UI
      chrome.runtime.sendMessage({ action: 'dataCleared' });
    });
  }
}

// View logs
function viewLogs() {
  chrome.storage.local.get(['wizzo_error_log'], function(result) {
    const logs = result.wizzo_error_log || [];
    
    // Create modal for logs
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    // Format logs
    let logsContent = '';
    if (logs.length === 0) {
      logsContent = '<p>No logs available</p>';
    } else {
      logs.forEach((log, index) => {
        logsContent += `
          <div class="log-entry">
            <div><strong>Time:</strong> ${new Date(log.timestamp).toLocaleString()}</div>
            <div><strong>Context:</strong> ${log.context}</div>
            <div><strong>Message:</strong> ${log.message}</div>
            ${log.stack ? `<div><strong>Stack:</strong> <pre>${log.stack}</pre></div>` : ''}
            ${index < logs.length - 1 ? '<hr>' : ''}
          </div>
        `;
      });
    }
    
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 600px; width: 90%;">
        <span class="close-modal">&times;</span>
        <h3>Debug Logs</h3>
        <div class="logs-container" style="max-height: 400px; overflow-y: auto;">
          ${logsContent}
        </div>
        <div style="margin-top: 15px; text-align: right;">
          <button id="clearLogsBtn" class="btn">Clear Logs</button>
          <button id="closeModalBtn" class="btn btn-primary">Close</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    modal.querySelector('.close-modal').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    modal.querySelector('#closeModalBtn').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    modal.querySelector('#clearLogsBtn').addEventListener('click', () => {
      chrome.storage.local.remove(['wizzo_error_log'], function() {
        alert('Logs cleared');
        document.body.removeChild(modal);
      });
    });
    
    // Close when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  });
}
