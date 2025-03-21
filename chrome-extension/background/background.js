// Main background script that initializes the extension

import { initAuthSystem } from './auth.js';
import { initSyncService } from './sync.js';
import { setupMessageHandlers } from './messaging.js';
import { trackError } from './errorTracking.js';

// Enable debug mode
const DEBUG = true;

// Initialize the extension
async function initExtension() {
  try {
    if (DEBUG) chrome.storage.local.set({ 'wizzo_debug': { lastInit: new Date().toISOString(), initStarted: true } });
    console.log('Initializing Wizzo extension...');
    
    // Initialize the authentication system
    await initAuthSystem();
    
    // Initialize the data synchronization service
    await initSyncService();
    
    // Set up message handlers for communication with popup and content scripts
    setupMessageHandlers();
    
    // Set up alarms for periodic tasks
    chrome.alarms.create('periodicSync', { periodInMinutes: 15 });
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'periodicSync') {
        syncWidgetData();
      }
    });
    
    console.log('Wizzo extension initialized successfully');
    if (DEBUG) chrome.storage.local.set({ 'wizzo_debug': { lastInit: new Date().toISOString(), initComplete: true } });
  } catch (error) {
    trackError('initialization', error);
    console.error('Failed to initialize extension:', error);
    if (DEBUG) chrome.storage.local.set({ 'wizzo_debug': { lastInit: new Date().toISOString(), initError: error.message, errorStack: error.stack } });
  }
}

// Start the extension
initExtension();
