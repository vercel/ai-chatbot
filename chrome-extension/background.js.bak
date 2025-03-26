// Updated background script with side panel support
console.log('Background script loaded');

// Enable the side panel to open when the action icon is clicked
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Initialize core services - we'll use standard Chrome messaging instead of ES imports
// to communicate with modular components

// Initialize all background services
async function initServices() {
  try {
    await initErrorTracking();
    await initAuthSystem();
    await initSyncService();
    await initMessaging();
    console.log('All services initialized successfully');
  } catch (error) {
    console.error('Error initializing services:', error);
  }
}

// Error tracking system
const ERROR_LOG_KEY = 'wizzo_error_log';
const MAX_ERROR_LOG_SIZE = 50;

async function initErrorTracking() {
  console.log('Initializing error tracking...');
  
  // Set up global error handler
  self.onerror = function(message, source, lineno, colno, error) {
    trackError('window.onerror', { message, source, lineno, colno, stack: error?.stack });
    return false;
  };
  
  // Set up unhandled promise rejection handler
  self.onunhandledrejection = function(event) {
    trackError('unhandledRejection', { 
      reason: event.reason?.message || event.reason,
      stack: event.reason?.stack 
    });
  };
  
  return true;
}

async function trackError(source, error) {
  try {
    const timestamp = new Date().toISOString();
    
    // Format the error object
    let errorDetails = {
      source,
      timestamp,
      message: error?.message || error
    };
    
    if (error?.stack) {
      errorDetails.stack = error.stack;
    }
    
    console.error(`[${source}] Error:`, errorDetails);
    
    // Get existing error log
    const { wizzo_error_log = [] } = await new Promise(resolve => {
      chrome.storage.local.get([ERROR_LOG_KEY], resolve);
    });
    
    // Add the new error to the log
    const updatedLog = [errorDetails, ...wizzo_error_log].slice(0, MAX_ERROR_LOG_SIZE);
    
    // Save the updated log
    await new Promise(resolve => {
      chrome.storage.local.set({ [ERROR_LOG_KEY]: updatedLog }, resolve);
    });
    
    // Save additional debug information
    await new Promise(resolve => {
      chrome.storage.local.set({
        wizzo_debug: {
          lastError: errorDetails,
          timestamp,
          navigator: {
            onLine: self.navigator?.onLine
          },
          runtime: {
            lastError: chrome.runtime.lastError
          }
        }
      }, resolve);
    });
    
    return true;
  } catch (e) {
    // Last resort console output if error tracking itself fails
    console.error('Error tracking system failure:', e);
    return false;
  }
}

// Authentication system
async function initAuthSystem() {
  console.log('Initializing authentication system...');
  
  // Get platform URL from settings
  const settings = await new Promise(resolve => {
    chrome.storage.local.get(['settings'], (result) => {
      resolve(result.settings || {});
    });
  });
  
  // Update API base URL from settings
  if (settings.platformUrl) {
    // Store for later use
    await chrome.storage.local.set({ 
      api_base_url: settings.platformUrl 
    });
  }
  
  return true;
}

// Messaging system
async function initMessaging() {
  console.log('Initializing messaging system...');
  
  // Listen for tab updates to potentially notify side panel
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
      // Send a message to the side panel with the new context
      notifySidePanel({
        action: 'tabUpdate',
        tabId,
        url: tab.url,
        title: tab.title
      });
    }
  });

  return true;
}

// Send a message to all open side panels
function notifySidePanel(message) {
  try {
    chrome.runtime.sendMessage(message).catch(error => {
      // Ignore errors about no receivers, which happen when side panel isn't open
      if (!error.message?.includes('Could not establish connection')) {
        console.error('Error sending message to side panel:', error);
      }
    });
  } catch (error) {
    trackError('notifySidePanel', error);
  }
}

// Sync service
async function initSyncService() {
  console.log('Initializing sync service...');
  
  // Listen for platform tabs being opened
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
      // Check if the URL is a Wizzo platform
      chrome.storage.local.get(['settings'], (result) => {
        const platformUrl = result.settings?.platformUrl || 'https://wizzo.com';
        
        if (tab.url.includes(platformUrl) || tab.url.includes('wizzo.com')) {
          console.log('Wizzo platform detected, triggering sync...');
          syncWidgetData();
        }
      });
    }
  });
  
  // Set initial sync status
  const syncStatus = await getSyncStatus();
  if (!syncStatus) {
    await setSyncStatus({
      lastSyncAttempt: null,
      lastSuccessfulSync: null,
      pendingChanges: 0,
      syncInProgress: false
    });
  }
  
  return true;
}

// Get the current sync status
async function getSyncStatus() {
  return new Promise(resolve => {
    chrome.storage.local.get(['wizzo_sync_status'], (result) => {
      resolve(result.wizzo_sync_status);
    });
  });
}

// Update the sync status
async function setSyncStatus(status) {
  return new Promise(resolve => {
    chrome.storage.local.set({ wizzo_sync_status: status }, () => {
      resolve(status);
    });
  });
}

// Synchronize widget data
async function syncWidgetData() {
  try {
    // Update sync status
    let syncStatus = await getSyncStatus() || {};
    syncStatus = await setSyncStatus({
      ...syncStatus,
      lastSyncAttempt: new Date().toISOString(),
      syncInProgress: true
    });
    
    // Notify all open side panels about the sync
    notifySidePanel({ 
      action: 'syncStarted'
    });
    
    // For now, simulate a successful sync
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update sync status
    await setSyncStatus({
      lastSyncAttempt: new Date().toISOString(),
      lastSuccessfulSync: new Date().toISOString(),
      pendingChanges: 0,
      syncInProgress: false
    });
    
    // Notify all open side panels about the sync completion
    notifySidePanel({ 
      action: 'syncComplete', 
      result: { 
        success: true, 
        syncedCount: 0 
      } 
    });
    
    console.log('Sync completed successfully');
    return { success: true, syncedCount: 0 };
  } catch (error) {
    trackError('syncWidgetData', error);
    
    // Update sync status
    const syncStatus = await getSyncStatus() || {};
    await setSyncStatus({
      ...syncStatus,
      syncInProgress: false
    });
    
    // Notify side panel
    notifySidePanel({ 
      action: 'syncError', 
      error: error.message 
    });
    
    return { success: false, error: 'Sync failed. Will retry later.' };
  }
}

// Start initialization
initServices();

// Handle messages from sidepanel/popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);
  
  // Handle authentication messages
  if (message.action === 'login') {
    handleLoginRequest(message, sendResponse);
  } else if (message.action === 'logout') {
    handleLogoutRequest(sendResponse);
  } else if (message.action === 'isAuthenticated' || message.action === 'checkAuth') {
    handleAuthCheck(sendResponse);
  } 
  // Handle data management messages
  else if (message.action === 'getStatus') {
    handleStatusRequest(sendResponse);
  } else if (message.action === 'getSyncStatus') {
    handleSyncStatusRequest(sendResponse);
  } else if (message.action === 'getWidgets') {
    handleGetWidgets(sendResponse);
  } else if (message.action === 'syncData' || message.action === 'syncNow') {
    handleSyncRequest(sendResponse);
  } else if (message.action === 'addWidget') {
    handleAddWidget(message.widget, sendResponse);
  } else {
    // Default response for unhandled messages
    sendResponse({ success: true });
  }
  
  // Return true to indicate that the response will be sent asynchronously
  return true;
});

// Auth handlers
async function handleLoginRequest(message, sendResponse) {
  try {
    const { email, password } = message;
    const settings = await new Promise(resolve => {
      chrome.storage.local.get(['settings'], result => {
        resolve(result.settings || {});
      });
    });
    
    // Get API URL - default to localhost in development
    const apiBaseUrl = settings?.platformUrl || 'http://localhost:3000';
    const loginUrl = `${apiBaseUrl}/api/extension/auth`;
    
    // Use the actual API endpoint from the main application
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      // Store the authentication token
      await chrome.storage.local.set({
        auth_token: data.token,
        auth_user: data.user
      });
      
      // Notify all open side panels about the auth change
      notifySidePanel({ action: 'authUpdate', isAuthenticated: true });
      
      sendResponse({ success: true, userId: data.user.id, email: data.user.email });
    } else {
      sendResponse({ success: false, error: data.error || 'Authentication failed' });
    }
  } catch (error) {
    console.error('Login error:', error);
    sendResponse({ success: false, error: error.message || 'Authentication failed' });
  }
}

async function handleLogoutRequest(sendResponse) {
  try {
    // Clear authentication data
    await chrome.storage.local.remove(['auth_token', 'auth_user', 'wizzo_stored_credentials']);
    
    // Notify all open side panels about the auth change
    notifySidePanel({ action: 'authUpdate', isAuthenticated: false });
    
    sendResponse({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    sendResponse({ success: false, error: error.message || 'Logout failed' });
  }
}

async function handleAuthCheck(sendResponse) {
  try {
    // Check if we have a token stored
    const { auth_token, auth_user } = await new Promise(resolve => {
      chrome.storage.local.get(['auth_token', 'auth_user'], result => {
        resolve(result);
      });
    });
    
    if (!auth_token) {
      sendResponse({ authenticated: false, isAuthenticated: false });
      return;
    }
    
    // Get API URL
    const settings = await new Promise(resolve => {
      chrome.storage.local.get(['settings'], result => {
        resolve(result.settings || {});
      });
    });
    
    const apiBaseUrl = settings?.platformUrl || 'http://localhost:3000';
    const validateUrl = `${apiBaseUrl}/api/extension/auth`;
    
    // Validate the token
    try {
      const response = await fetch(validateUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth_token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        sendResponse({ 
          authenticated: true, 
          isAuthenticated: true, 
          email: auth_user?.email || 'User'
        });
      } else {
        // Token is invalid, remove it
        await chrome.storage.local.remove(['auth_token', 'auth_user']);
        sendResponse({ authenticated: false, isAuthenticated: false });
      }
    } catch (error) {
      // If we can't reach the server, but we have a token, consider user authenticated
      // This allows offline usage
      sendResponse({ 
        authenticated: true, 
        isAuthenticated: true, 
        email: auth_user?.email || 'User',
        offline: true
      });
    }
  } catch (error) {
    console.error('Auth check error:', error);
    sendResponse({ authenticated: false, isAuthenticated: false, error: error.message });
  }
}

// Data handlers
async function handleStatusRequest(sendResponse) {
  // Get online status and other relevant info
  sendResponse({ status: true, online: navigator.onLine });
}

async function handleSyncStatusRequest(sendResponse) {
  try {
    const syncStatus = await getSyncStatus();
    sendResponse({ 
      pendingChanges: syncStatus ? syncStatus.pendingChanges : 0,
      lastSync: syncStatus ? syncStatus.lastSuccessfulSync : null
    });
  } catch (error) {
    console.error('Sync status error:', error);
    sendResponse({ pendingChanges: 0, error: error.message });
  }
}

async function handleGetWidgets(sendResponse) {
  try {
    // For testing, return mock widgets
    const widgets = [
      { id: 'widget1', title: 'Sample Widget', type: 'chart', updatedAt: new Date().toISOString(), syncedAt: new Date().toISOString() },
      { id: 'widget2', title: 'Analytics Dashboard', type: 'dashboard', updatedAt: new Date().toISOString(), syncedAt: new Date().toISOString() },
      { id: 'widget3', title: 'User Metrics', type: 'counter', updatedAt: new Date().toISOString() }
    ];
    sendResponse({ success: true, widgets });
  } catch (error) {
    console.error('Get widgets error:', error);
    sendResponse({ success: false, error: error.message, widgets: [] });
  }
}

async function handleSyncRequest(sendResponse) {
  try {
    const result = await syncWidgetData();
    sendResponse(result);
  } catch (error) {
    console.error('Sync error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleAddWidget(widget, sendResponse) {
  try {
    // For testing, just return the widget with an ID
    const newWidget = {
      ...widget,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    sendResponse({ success: true, widget: newWidget });
  } catch (error) {
    console.error('Add widget error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Set up alarms for periodic tasks
chrome.alarms.create('periodicSync', { periodInMinutes: 15 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'periodicSync') {
    console.log('Periodic sync triggered');
    try {
      await syncWidgetData();
    } catch (error) {
      console.error('Periodic sync error:', error);
    }
  }
});
