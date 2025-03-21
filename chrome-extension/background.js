// Background script stub
console.log('Background script loaded');

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);
  
  // Return success for all messages for now
  if (message.action === 'login') {
    sendResponse({ success: true, userId: 'user123', email: message.email });
  } else if (message.action === 'logout') {
    sendResponse({ success: true });
  } else if (message.action === 'isAuthenticated' || message.action === 'checkAuth') {
    sendResponse({ authenticated: true, isAuthenticated: true, email: 'user@example.com' });
  } else if (message.action === 'getStatus') {
    sendResponse({ status: true, online: true });
  } else if (message.action === 'getSyncStatus') {
    sendResponse({ pendingChanges: 0 });
  } else if (message.action === 'getWidgets') {
    sendResponse({ 
      success: true, 
      widgets: [
        { id: 'widget1', title: 'Sample Widget', type: 'chart', updatedAt: new Date().toISOString(), syncedAt: new Date().toISOString() },
        { id: 'widget2', title: 'Another Widget', type: 'counter', updatedAt: new Date().toISOString() }
      ] 
    });
  } else if (message.action === 'syncData' || message.action === 'syncNow') {
    sendResponse({ success: true });
  } else {
    sendResponse({ success: true });
  }
  
  // Return true to indicate that the response will be sent asynchronously
  return true;
});

// Set up alarms for periodic tasks
chrome.alarms.create('periodicSync', { periodInMinutes: 15 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'periodicSync') {
    console.log('Periodic sync triggered');
  }
});
