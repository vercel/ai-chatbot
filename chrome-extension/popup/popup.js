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
  
  // Chat functionality
  const sendButton = document.getElementById('sendButton');
  if (sendButton) {
    sendButton.addEventListener('click', sendChatMessage);
  }
  
  const inputText = document.getElementById('inputText');
  if (inputText) {
    inputText.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        sendChatMessage();
      }
    });
  }
  
  // Add chat button
  const addChatBtn = document.querySelector('.add-chat-btn');
  if (addChatBtn) {
    addChatBtn.addEventListener('click', createNewChat);
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
  snoozeCurrentTab(option);
}

// Handle dropdown item click
function handleDropdownItem(event) {
  const option = event.target.textContent.trim();
  snoozeCurrentTab(option);
  
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

// Snooze the current tab
function snoozeCurrentTab(duration) {
  console.log(`Snoozing current tab for ${duration}`);
  
  chrome.runtime.sendMessage({ 
    action: 'snoozeTab', 
    duration: duration 
  }, response => {
    if (response && response.success) {
      addChatMessage(`✨ Tab magically snoozed for ${duration}`, 'system');
    } else {
      addChatMessage(`Magic failed: ${response?.error || 'Unknown error'}`, 'system');
    }
  });
}

// Add a message to the chat display
function addChatMessage(message, sender = 'user') {
  const chatDisplay = document.querySelector('.chat-display');
  if (!chatDisplay) return;
  
  const messageElement = document.createElement('p');
  messageElement.className = `chat-message ${sender}`;
  messageElement.textContent = message;
  chatDisplay.appendChild(messageElement);
  
  // Scroll to bottom
  chatDisplay.scrollTop = chatDisplay.scrollHeight;
}

// Send a chat message
function sendChatMessage() {
  const inputField = document.getElementById('inputText');
  if (!inputField) return;
  
  const message = inputField.value.trim();
  
  if (message) {
    addChatMessage(message);
    inputField.value = '';
    
    // Simulate a response after a short delay
    setTimeout(() => {
      const responses = [
        "Let me wave my magic wand to help you with that ✨",
        "I'll cast a helpful spell for that request! 🪄",
        "My magical powers are at your service!",
        "Abracadabra! I'm working on your request.",
        "Let me sprinkle some magic on that for you ✨"
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      addChatMessage(randomResponse, 'assistant');
    }, 1000);
  }
}

// Create a new chat
function createNewChat() {
  const chatDisplay = document.querySelector('.chat-display');
  if (!chatDisplay) return;
  
  chatDisplay.innerHTML = '';
  addChatMessage("How can I help with my magic wand today? ✨", 'assistant');
}
