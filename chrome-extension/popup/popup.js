// Popup UI controller
document.addEventListener('DOMContentLoaded', function() {
  initPopup();
});

// Initialize the popup
function initPopup() {
  setupEventListeners();
}

// Set up event listeners
function setupEventListeners() {
  // Snooze tab options
  document.querySelectorAll('.snooze-option').forEach(button => {
    button.addEventListener('click', handleSnoozeOption);
  });
  
  // Dropdown items
  document.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', handleDropdownItem);
  });
  
  // Open side panel button
  const openSidePanelBtn = document.getElementById('openSidePanel');
  if (openSidePanelBtn) {
    openSidePanelBtn.addEventListener('click', async () => {
      try {
        // Get current tab's window
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs && tabs.length > 0) {
          const windowId = tabs[0].windowId;
          
          // Open side panel in the current window
          chrome.runtime.sendMessage({ 
            action: 'openSidePanel', 
            windowId: windowId 
          });
        } else {
          // Fallback if we can't get the current tab
          chrome.runtime.sendMessage({ action: 'openSidePanel' });
        }
      } catch (error) {
        console.error('Error opening side panel:', error);
      }
      
      // Close popup
      window.close();
    });
  }
}

// Handle snooze option click
function handleSnoozeOption(event) {
  // If it's the custom dropdown button, don't do anything (dropdown will show on hover)
  if (event.target.classList.contains('custom')) {
    return;
  }
  
  const option = event.target.textContent.trim();
  
  // Remove active class from all options
  document.querySelectorAll('.snooze-option').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Add active class to clicked option
  event.target.classList.add('active');
  
  // Perform the snooze action
  snoozeSelectedTabs(option);
}

// Handle dropdown item click
function handleDropdownItem(event) {
  const option = event.target.textContent.trim();
  snoozeSelectedTabs(option);
  
  // Hide dropdown
  const dropdown = document.querySelector('.dropdown-content');
  if (dropdown) {
    dropdown.style.display = 'none';
  }
  
  // Show selected in custom button
  const customButton = document.querySelector('.snooze-option.custom');
  if (customButton) {
    customButton.textContent = `Custom: ${option} ▼`;
  }
  
  // Remove active class from all options and add to custom
  document.querySelectorAll('.snooze-option').forEach(btn => {
    btn.classList.remove('active');
  });
  
  if (customButton) {
    customButton.classList.add('active');
  }
}

// Snooze selected tabs
async function snoozeSelectedTabs(duration) {
  console.log(`Snoozing selected tabs for ${duration}`);
  
  try {
    // Get highlighted tabs
    const tabs = await chrome.tabs.query({ highlighted: true, currentWindow: true });
    
    if (tabs.length === 0) {
      // If no tabs are highlighted, just snooze the current tab
      chrome.runtime.sendMessage({ 
        action: 'snoozeTab',
        duration: duration 
      }, handleSnoozeResponse);
    } else if (tabs.length === 1) {
      // If only one tab is highlighted, use snoozeTab
      chrome.runtime.sendMessage({ 
        action: 'snoozeTab',
        tabId: tabs[0].id,
        duration: duration 
      }, handleSnoozeResponse);
    } else {
      // If multiple tabs are highlighted, use snoozeTabs
      const tabIds = tabs.map(tab => tab.id);
      chrome.runtime.sendMessage({ 
        action: 'snoozeTabs',
        tabIds: tabIds,
        duration: duration 
      }, handleSnoozeResponse);
    }
  } catch (error) {
    console.error('Error getting selected tabs:', error);
    displayErrorMessage(`Failed to snooze tabs: ${error.message}`);
  }
}

// Handle snooze response
function handleSnoozeResponse(response) {
  if (!response) {
    displayErrorMessage('Failed to snooze tabs: Unknown error');
    return;
  }
  
  if (response.success) {
    if (response.snoozedTabs && response.snoozedTabs.length > 0) {
      // Multiple tabs were snoozed
      const formattedWakeTime = new Date(response.snoozedTabs[0].wakeTime).toLocaleString();
      displaySuccessMessage(`${response.snoozedTabs.length} tabs magically snoozed for ${response.snoozedTabs[0].duration} until ${formattedWakeTime}`);
    } else if (response.tabInfo) {
      // Single tab was snoozed
      const formattedWakeTime = new Date(response.tabInfo.wakeTime).toLocaleString();
      displaySuccessMessage(`Tab magically snoozed for ${response.tabInfo.duration} until ${formattedWakeTime}`);
    } else {
      // Generic success message
      displaySuccessMessage('Tabs successfully snoozed!');
    }
  } else {
    displayErrorMessage(`Failed to snooze tabs: ${response.error || 'Unknown error'}`);
  }
}

// Display error message
function displayErrorMessage(message) {
  const messageElement = document.createElement('div');
  messageElement.className = 'message error-message';
  messageElement.textContent = message;
  
  document.querySelector('.container').appendChild(messageElement);
  
  // Remove after 5 seconds
  setTimeout(() => {
    if (messageElement && messageElement.parentNode) {
      messageElement.remove();
    }
  }, 5000);
}

// Display success message
function displaySuccessMessage(message) {
  const messageElement = document.createElement('div');
  messageElement.className = 'message success-message';
  messageElement.textContent = message;
  
  document.querySelector('.container').appendChild(messageElement);
  
  // Remove after 5 seconds
  setTimeout(() => {
    if (messageElement && messageElement.parentNode) {
      messageElement.remove();
    }
  }, 5000);
}
