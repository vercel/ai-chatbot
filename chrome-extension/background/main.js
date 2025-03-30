// Main background script
import { initAuthSystem } from './auth.js';
import { initErrorTracking } from './errorTracking.js';

// Initialize the extension
async function initExtension() {
  console.log('Initializing Wizzo Magic Wand extension...');
  
  // Initialize error tracking
  await initErrorTracking();
  
  // Initialize authentication system
  await initAuthSystem();
  
  // Register side panel with fixed behavior
  chrome.sidePanel.setOptions({
    path: 'sidepanel/index.html',
    enabled: true
  });
  
  // Set default behavior for side panel
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  
  // Set up listeners to auto-open the side panel
  chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed or updated, setting up side panel');
    chrome.sidePanel.setOptions({ path: 'sidepanel/index.html', enabled: true });
    
    // Auto-open side panel after a short delay
    setTimeout(() => {
      chrome.windows.getAll({ windowTypes: ['normal'] }, (windows) => {
        windows.forEach(window => {
          try {
            chrome.sidePanel.open({ windowId: window.id });
            console.log(`Opening side panel for window ${window.id}`);
          } catch (error) {
            console.error(`Error opening side panel for window ${window.id}:`, error);
          }
        });
      });
    }, 1000);
  });

  
  // Open side panel automatically when a window is opened
  chrome.windows.onCreated.addListener(async (window) => {
    if (window.type === 'normal') {
      // Wait a moment for the window to initialize
      setTimeout(async () => {
        try {
          await chrome.sidePanel.open({ windowId: window.id });
          console.log(`Side panel opened for new window ${window.id}`);
        } catch (error) {
          console.error(`Error opening side panel for new window ${window.id}:`, error);
          // Try again with a delay
          setTimeout(async () => {
            try {
              await chrome.sidePanel.open({ windowId: window.id });
              console.log(`Side panel opened on retry for window ${window.id}`);
            } catch (retryError) {
              console.error(`Failed to open side panel on retry:`, retryError);
            }
          }, 1000);
        }
      }, 500);
    }
  });

  
  // Set up message handlers
  setupMessageHandlers();
  
  // Listen for web navigation to catch when user completes login
  chrome.webNavigation.onCompleted.addListener(async (details) => {
    // Check if this is navigation from our app domain
    if (details.url.startsWith('http://localhost:3000')) {
      console.log('Detected navigation in main app:', details.url);
      
      // Check if this might be a post-login redirect
      if (details.url.includes('/dashboard') || details.url.includes('/home')) {
        console.log('Detected possible post-login navigation');
        
        // Check if we have a pending login redirect
        const { wizzo_login_redirect } = await chrome.storage.local.get('wizzo_login_redirect');
        
        if (wizzo_login_redirect) {
          console.log('User has completed login flow');
          // Wait a moment for cookies to be properly set
          setTimeout(() => {
            // Broadcast a message to inform sidepanel/popup
            chrome.runtime.sendMessage({ 
              action: 'loginCompleted',
              url: details.url
            });
          }, 1000);
        }
      }
    }
  });
  
  // We've removed the automatic sidepanel opening on tab activation
  // because it violates Chrome's security policy that requires a user gesture
  chrome.tabs.onActivated.addListener(async (activeInfo) => {
    // Log tab activation but don't try to open sidepanel automatically
    console.log(`Tab activated: ${activeInfo.tabId}`);
  });
  
  // Set up alarms for periodic tasks
  chrome.alarms.create('checkSnoozedTabs', { periodInMinutes: 1 });
  chrome.alarms.onAlarm.addListener(handleAlarms);

  console.log('Wizzo Magic Wand extension initialized successfully');
}

// Set up message handlers
function setupMessageHandlers() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Received message:', message);
    
    if (message.action === 'snoozeTab') {
      snoozeTab(message.tabId, message.duration)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Keep the message channel open for async response
    }
    
    if (message.action === 'snoozeTabs') {
      snoozeTabs(message.tabIds, message.duration)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Keep the message channel open for async response
    }
    
    if (message.action === 'openSidePanel') {
      try {
        const windowId = message.windowId;
        if (windowId) {
          // Open side panel for the specified window
          chrome.sidePanel.setOptions({ path: 'sidepanel/index.html', enabled: true })
            .then(() => {
              // Use a setTimeout to ensure setOptions completes first
              setTimeout(() => {
                try {
                  chrome.windows.get(windowId, (window) => {
                    if (chrome.runtime.lastError) {
                      console.error(chrome.runtime.lastError);
                      return;
                    }
                    
                    if (window) {
                      console.log(`Opening side panel for window ${windowId}`);
                      chrome.sidePanel.open({ windowId });
                    }
                  });
                } catch (err) {
                  console.error('Error in openSidePanel handler:', err);
                }
              }, 100);
            });
        } else {
          // No window ID, try to open for all windows
          chrome.windows.getAll({ windowTypes: ['normal'] }, (windows) => {
            windows.forEach(window => {
              try {
                console.log(`Opening side panel for all windows`);
                chrome.sidePanel.open({ windowId: window.id });
              } catch (error) {
                console.error(`Error opening side panel for window ${window.id}:`, error);
              }
            });
          });
        }
      } catch (error) {
        console.error('Error handling openSidePanel message:', error);
      }
      return false; // No async response needed
    }
    
    return false;
  });
}

// Handle alarms
function handleAlarms(alarm) {
  if (alarm.name === 'checkSnoozedTabs') {
    checkSnoozedTabs();
  }
}

// Snooze a single tab
async function snoozeTab(tabId, duration) {
  try {
    // Get the tab if tabId wasn't provided
    let tab;
    if (!tabId) {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs.length === 0) {
        throw new Error('No active tab found');
      }
      tab = tabs[0];
      tabId = tab.id;
    } else {
      tab = await chrome.tabs.get(tabId);
    }
    
    // Calculate wake time
    const wakeTime = calculateWakeTime(duration);
    
    // Store tab info
    const tabInfo = {
      id: tabId,
      url: tab.url,
      title: tab.title,
      faviconUrl: tab.favIconUrl,
      snoozedAt: Date.now(),
      wakeTime: wakeTime.getTime(),
      duration: duration
    };
    
    // Get existing snoozed tabs
    const { snoozedTabs = [] } = await chrome.storage.local.get('snoozedTabs');
    
    // Add new snoozed tab
    snoozedTabs.push(tabInfo);
    
    // Save updated list
    await chrome.storage.local.set({ snoozedTabs });
    
    // In snoozeTab, we don't need to save to knowledge base when called from snoozeTabs
    // because snoozeTabs already handles it
    if (!tabId) { // only save if called directly for the current tab
      try {
        await saveTabToKnowledge(tab);
      } catch (knowledgeError) {
        console.error('Error saving tab to knowledge base:', knowledgeError);
        // Continue with snoozing even if knowledge save fails
      }
    }
    
    // Close the tab
    await chrome.tabs.remove(tabId);
    
    return { 
      success: true, 
      message: `Tab snoozed until ${wakeTime.toLocaleString()}`,
      tabInfo: tabInfo 
    };
  } catch (error) {
    console.error('Error snoozing tab:', error);
    return { success: false, error: error.message };
  }
}

// Snooze multiple tabs
async function snoozeTabs(tabIds, duration) {
  try {
    // Validate input
    if (!tabIds || !Array.isArray(tabIds) || tabIds.length === 0) {
      // If no tabIds provided, get selected tabs
      const tabs = await chrome.tabs.query({ highlighted: true, currentWindow: true });
      if (tabs.length === 0) {
        throw new Error('No tabs selected');
      }
      tabIds = tabs.map(tab => tab.id);
    }
    
    // Get tab details first before closing them
    const tabsToSnooze = [];
    for (const tabId of tabIds) {
      try {
        const tab = await chrome.tabs.get(tabId);
        tabsToSnooze.push(tab);
      } catch (error) {
        console.error(`Error getting tab details for tab ${tabId}:`, error);
      }
    }
    
    const snoozedTabs = [];
    const errors = [];
    
    // Try to save tabs to knowledge base in bulk
    try {
      await Promise.all(tabsToSnooze.map(tab => saveTabToKnowledge(tab)));
    } catch (knowledgeError) {
      console.error('Error saving tabs to knowledge base:', knowledgeError);
      // Continue with snoozing even if knowledge save fails
    }
    
    // Process each tab
    for (const tab of tabsToSnooze) {
      try {
        const result = await snoozeTab(tab.id, duration);
        if (result.success) {
          snoozedTabs.push(result.tabInfo);
        } else {
          errors.push({ tabId: tab.id, error: result.error });
        }
      } catch (error) {
        errors.push({ tabId: tab.id, error: error.message });
      }
    }
    
    if (snoozedTabs.length === 0 && errors.length > 0) {
      return { 
        success: false, 
        error: 'Failed to snooze any tabs', 
        details: errors 
      };
    }
    
    // Calculate the wake time display (all tabs will have the same wake time)
    const wakeTimeDisplay = snoozedTabs.length > 0 
      ? new Date(snoozedTabs[0].wakeTime).toLocaleString() 
      : '';
    
    return {
      success: true,
      message: `${snoozedTabs.length} tabs snoozed until ${wakeTimeDisplay}`,
      snoozedTabs: snoozedTabs,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error) {
    console.error('Error snoozing multiple tabs:', error);
    return { success: false, error: error.message };
  }
}

// Calculate wake time based on duration string
function calculateWakeTime(duration) {
  const now = new Date();
  
  if (duration === '1h') {
    return new Date(now.getTime() + 60 * 60 * 1000);
  } else if (duration === '2h') {
    return new Date(now.getTime() + 2 * 60 * 60 * 1000);
  } else if (duration === '2 mins') {
    return new Date(now.getTime() + 2 * 60 * 1000);
  } else if (duration === 'in 2 days') {
    const twoDays = new Date(now);
    twoDays.setDate(twoDays.getDate() + 2);
    twoDays.setHours(9, 0, 0, 0);
    return twoDays;
  } else if (duration === 'Tom' || duration === 'Tomorrow') {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow;
  } else if (duration === 'next weekend') {
    const today = now.getDay(); // 0 is Sunday, 6 is Saturday
    const daysUntilSaturday = (today === 6) ? 7 : (6 - today);
    
    const nextWeekend = new Date(now);
    nextWeekend.setDate(nextWeekend.getDate() + daysUntilSaturday);
    nextWeekend.setHours(9, 0, 0, 0);
    return nextWeekend;
  } else if (duration === 'next Sunday') {
    const today = now.getDay(); // 0 is Sunday
    const daysUntilSunday = (today === 0) ? 7 : (7 - today);
    
    const nextSunday = new Date(now);
    nextSunday.setDate(nextSunday.getDate() + daysUntilSunday);
    nextSunday.setHours(9, 0, 0, 0);
    return nextSunday;
  } else {
    // Default to 1 hour if unknown duration
    return new Date(now.getTime() + 60 * 60 * 1000);
  }
}

// Check for snoozed tabs that need to be woken up
async function checkSnoozedTabs() {
  try {
    // Get snoozed tabs
    const { snoozedTabs = [] } = await chrome.storage.local.get('snoozedTabs');
    if (snoozedTabs.length === 0) return;
    
    const now = Date.now();
    const tabsToWake = [];
    const remainingTabs = [];
    
    // Separate tabs that need to be woken up
    snoozedTabs.forEach(tab => {
      if (tab.wakeTime <= now) {
        tabsToWake.push(tab);
      } else {
        remainingTabs.push(tab);
      }
    });
    
    if (tabsToWake.length === 0) return;
    
    // Wake up tabs
    for (const tab of tabsToWake) {
      try {
        await chrome.tabs.create({ url: tab.url });
      } catch (error) {
        console.error(`Error waking up tab ${tab.id}:`, error);
      }
    }
    
    // Update storage with remaining tabs
    await chrome.storage.local.set({ snoozedTabs: remainingTabs });
  } catch (error) {
    console.error('Error checking snoozed tabs:', error);
  }
}

// Save a tab URL to the knowledge base
async function saveTabToKnowledge(tab) {
  try {
    console.log(`Saving tab to knowledge base: ${tab.url}`);
    
    // Get auth data for API request
    const { API_BASE_URL } = await import('./auth.js');
    const { getAuthHeaders } = await import('./auth.js');
    
    // Get authorization headers
    const headers = await getAuthHeaders();
    
    // Prepare knowledge data
    const knowledgeData = {
      url: tab.url,
      title: tab.title || 'Snoozed Tab',
      source: 'chrome-extension'
    };
    
    // Send to knowledge-url endpoint
    const response = await fetch(`${API_BASE_URL}/api/knowledge-url`, {
      method: 'POST',
      headers,
      body: JSON.stringify(knowledgeData)
    });
    
    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(`Failed to save to knowledge base: ${response.status} ${responseText}`);
    }
    
    const data = await response.json();
    console.log('Tab saved to knowledge base successfully:', data);
    return data;
  } catch (error) {
    console.error('Error saving tab to knowledge base:', error);
    throw error;
  }
}

// Start the extension
initExtension();
