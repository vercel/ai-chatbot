// Message handling for communication between components

import { login, logout, checkAuthStatus } from './auth.js';
import { syncWidgetData, getWidgetData, addWidget, updateWidget, deleteWidget, getSyncStatus } from './sync.js';
import { trackError } from './errorTracking.js';

// Set up message handlers
export function setupMessageHandlers() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Handle the message asynchronously
    handleMessage(message, sender).then(sendResponse);
    
    // Return true to indicate that sendResponse will be called asynchronously
    return true;
  });
}

// Handle messages from popup and content scripts
async function handleMessage(message, sender) {
  try {
    console.log('Received message:', message.action);
    
    switch (message.action) {
      case 'login':
        return await login(message.email, message.password);
        
      case 'logout':
        return await logout();
        
      case 'checkAuth':
        return await checkAuthStatus();
        
      case 'syncData':
        return await syncWidgetData();
        
      case 'getWidgets':
        return { success: true, widgets: await getWidgetData() };
        
      case 'addWidget':
        return { success: true, widget: await addWidget(message.widget) };
        
      case 'updateWidget':
        return { success: true, widget: await updateWidget(message.widgetId, message.updates) };
        
      case 'deleteWidget':
        return { success: true, deleted: await deleteWidget(message.widgetId) };
        
      case 'getSyncStatus':
        return { success: true, status: await getSyncStatus() };
        
      // Compatibility with existing extension
      case 'isAuthenticated':
        const authStatus = await checkAuthStatus();
        return { 
          authenticated: authStatus.isAuthenticated,
          email: authStatus.email || null
        };
        
      case 'getStatus':
        const status = await checkAuthStatus();
        return { 
          status: status.isAuthenticated,
          authenticated: status.isAuthenticated,
          email: status.email || null
        };
        
      default:
        console.warn('Unknown message action:', message.action);
        return { success: false, error: 'Unknown action' };
    }
  } catch (error) {
    trackError('handleMessage', error);
    return { success: false, error: 'Failed to process request' };
  }
}
