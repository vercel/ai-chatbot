// Main background script

// Initialize the extension
function initExtension() {
  console.log('Initializing Wizzo Magic Wand extension...');
  
  // Register side panel
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  
  // Set up message handlers
  setupMessageHandlers();
  
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
    
    return false;
  });
}

// Handle alarms
function handleAlarms(alarm) {
  if (alarm.name === 'checkSnoozedTabs') {
    checkSnoozedTabs();
  }
}

// Snooze a tab
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
    
    // Close the tab
    await chrome.tabs.remove(tabId);
    
    return { success: true, message: `Tab snoozed until ${wakeTime.toLocaleString()}` };
  } catch (error) {
    console.error('Error snoozing tab:', error);
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
  } else if (duration === '3h') {
    return new Date(now.getTime() + 3 * 60 * 60 * 1000);
  } else if (duration === '4h') {
    return new Date(now.getTime() + 4 * 60 * 60 * 1000);
  } else if (duration === 'Tom' || duration === 'Tomorrow') {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow;
  } else if (duration === 'Next week') {
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(9, 0, 0, 0);
    return nextWeek;
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

// Start the extension
initExtension();
