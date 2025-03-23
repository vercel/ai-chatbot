// Synchronization status component for side panel

/**
 * Initialize synchronization status functionality
 * @param {Object} params - Parameters for initialization
 * @param {Function} params.onSyncStarted - Callback when sync starts
 * @param {Function} params.onSyncCompleted - Callback when sync completes
 * @returns {Object} - Sync status controller methods
 */
export function initSyncStatus({ onSyncStarted, onSyncCompleted }) {
  // DOM elements
  const syncButton = document.getElementById('syncButton');
  const syncStatusText = document.getElementById('syncStatusText');
  const connectionStatus = document.getElementById('connectionStatus');
  
  // Event listeners
  syncButton.addEventListener('click', triggerSync);
  
  // Update connection status based on online/offline events
  window.addEventListener('online', updateConnectionStatus);
  window.addEventListener('offline', updateConnectionStatus);
  
  // Check initial connection status
  updateConnectionStatus();
  
  /**
   * Trigger manual synchronization
   */
  async function triggerSync() {
    try {
      // Update UI
      syncButton.disabled = true;
      syncStatusText.textContent = 'Syncing...';
      syncStatusText.className = '';
      
      // Notify sync started
      if (typeof onSyncStarted === 'function') {
        onSyncStarted();
      }
      
      // Send sync message to background script
      const response = await chrome.runtime.sendMessage({ action: 'syncData' });
      
      // Re-enable sync button
      syncButton.disabled = false;
      
      if (response && response.success) {
        // Update UI with success
        syncStatusText.textContent = 'All synced';
        syncStatusText.className = '';
        
        // Notify sync completed
        if (typeof onSyncCompleted === 'function') {
          onSyncCompleted(response);
        }
      } else {
        // Update UI with error
        syncStatusText.textContent = 'Sync failed';
        syncStatusText.className = 'sync-error';
        console.error('Sync failed:', response?.error);
      }
    } catch (error) {
      // Handle errors
      syncButton.disabled = false;
      syncStatusText.textContent = 'Sync error';
      syncStatusText.className = 'sync-error';
      console.error('Sync error:', error);
    }
  }
  
  /**
   * Update connection status indicator
   */
  function updateConnectionStatus() {
    if (navigator.onLine) {
      connectionStatus.textContent = 'Online';
      connectionStatus.className = 'connection-status online';
    } else {
      connectionStatus.textContent = 'Offline';
      connectionStatus.className = 'connection-status offline';
    }
  }
  
  /**
   * Update sync status display
   * @param {number} pendingChanges - Number of pending changes
   */
  function updateSyncStatus(pendingChanges) {
    if (pendingChanges > 0) {
      syncStatusText.textContent = `${pendingChanges} pending changes`;
      syncStatusText.className = 'sync-needed';
    } else {
      syncStatusText.textContent = 'All synced';
      syncStatusText.className = '';
    }
  }
  
  /**
   * Set syncing in progress UI state
   */
  function setSyncingState() {
    syncButton.disabled = true;
    syncStatusText.textContent = 'Syncing...';
    connectionStatus.textContent = 'Syncing';
    connectionStatus.className = 'connection-status syncing';
  }
  
  /**
   * Reset syncing UI state
   */
  function resetSyncingState() {
    syncButton.disabled = false;
    updateConnectionStatus();
  }
  
  /**
   * Check synchronization status from background
   */
  async function checkSyncStatus() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getSyncStatus' });
      updateSyncStatus(response.pendingChanges || 0);
      
      return response;
    } catch (error) {
      console.error('Error checking sync status:', error);
      return { pendingChanges: 0, error };
    }
  }
  
  // Return public methods
  return {
    updateSyncStatus,
    triggerSync,
    setSyncingState,
    resetSyncingState,
    checkSyncStatus,
    updateConnectionStatus
  };
}
