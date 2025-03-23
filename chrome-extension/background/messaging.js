// Messaging system for background to side panel communication

import { trackError } from './errorTracking.js';

// Initialize the messaging system
export async function initMessaging() {
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
export function notifySidePanel(message) {
  try {
    chrome.runtime.sendMessage(message).catch(error => {
      // Ignore errors about no receivers, which happen when side panel isn't open
      if (!error.message.includes('Could not establish connection')) {
        console.error('Error sending message to side panel:', error);
      }
    });
  } catch (error) {
    trackError('notifySidePanel', error);
  }
}

// Send a notification to the user
export function sendNotification(title, message, options = {}) {
  try {
    const notificationOptions = {
      type: 'basic',
      iconUrl: '../icons/icon128.png',
      title,
      message,
      ...options
    };
    
    chrome.notifications.create('', notificationOptions);
  } catch (error) {
    trackError('sendNotification', error);
    // Fallback to console if notifications fail
    console.log(`Notification: ${title} - ${message}`);
  }
}
