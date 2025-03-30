// Side panel controller
document.addEventListener('DOMContentLoaded', function() {
  initSidePanel();
});

// Check authentication when sidepanel becomes visible
document.addEventListener('visibilitychange', function() {
  if (!document.hidden) {
    // Check if we're returning from a login redirect
    chrome.storage.local.get(['wizzo_login_redirect', 'wizzo_login_redirect_time'], async function(result) {
      if (result.wizzo_login_redirect) {
        console.log('Returned to extension after login redirect');
        
        // Only consider this valid if it happened in the last 10 minutes
        const now = Date.now();
        const redirectTime = result.wizzo_login_redirect_time || 0;
        const timeElapsed = now - redirectTime;
        
        if (timeElapsed < 10 * 60 * 1000) { // 10 minutes
          // Clear the redirect flag
          chrome.storage.local.set({ 'wizzo_login_redirect': false });
          
          // Update UI to show checking authentication
          const connectionMessage = document.getElementById('connectionMessage');
          if (connectionMessage) {
            connectionMessage.textContent = 'Checking authentication...';
          }
          
          // Force an authentication check
          try {
            const isAuthenticated = await window.wizzoApi.isAuthenticated();
            console.log('Authentication check result:', isAuthenticated);
            
            if (isAuthenticated) {
              // User is authenticated, update UI
              showAuthenticatedUI();
            }
          } catch (error) {
            console.error('Authentication check failed:', error);
          }
        }
      }
    });
  }
});

async function initSidePanel() {
  // Set up event listeners first
  setupEventListeners();
  
  // Force showing login UI first
  showLoginUI();
  console.log('Side panel initialized with login UI');
  
  // Try to login with saved credentials
  try {
    const savedCredentials = await window.wizzoApi.getSavedCredentials();
    if (savedCredentials && savedCredentials.email && savedCredentials.password) {
      console.log('Found saved credentials, attempting auto-login...');
      
      try {
        // Prefill the login form
        const emailInput = document.getElementById('email');
        if (emailInput) emailInput.value = savedCredentials.email;
        
        // Attempt login with saved credentials
        const result = await window.wizzoApi.login(savedCredentials.email, savedCredentials.password, true);
        
        if (result.success) {
          console.log('Auto-login successful');
          // Auth will be checked and UI updated by checkAuthentication
        } else {
          console.log('Auto-login failed, proceeding to manual login');
          // Clear saved credentials if they're invalid
          await window.wizzoApi.clearCredentials();
        }
      } catch (error) {
        console.error('Error during auto-login:', error);
      }
    }
  } catch (autoLoginError) {
    console.error('Error checking saved credentials:', autoLoginError);
  }
  
  // Check authentication state last
  await checkAuthentication();
}

// Automatically create a new chat or open the most recent chat
async function createOrOpenChat() {
  try {
    console.log('Attempting to create or open a chat...');
    const history = await window.wizzoApi.getChatHistory();
    
    if (history && history.length > 0) {
      // Open most recent chat
      console.log('Opening most recent chat:', history[0].id);
      openChatThread(history[0].id);
    } else {
      // Create a new chat
      console.log('No existing chats, creating a new one');
      try {
        await createNewChat();
      } catch (error) {
        console.error('Failed to create new chat on startup:', error);
      }
    }
  } catch (error) {
    console.error('Failed to create or open chat:', error);
    displayErrorMessage('Failed to load or create chat. Please try again.');
  }
}

// Check if user is authenticated
async function checkAuthentication() {
  try {
    // Initialize UI state
    const activeChat = document.querySelector('.active-chat');
    const chatThreads = document.querySelector('.chat-threads');
    if (activeChat && chatThreads) {
      activeChat.classList.add('hidden');
      chatThreads.classList.remove('hidden');
    }
    
    // Always show login form first
    console.log('Initial display: showing login form');
    showLoginUI();

    console.log('Checking authentication...');
    const isAuthenticated = await window.wizzoApi.isAuthenticated();
    console.log('Authentication check result:', isAuthenticated);
    
    if (isAuthenticated) {
      // User is authenticated, update to show main UI
      console.log('User is authenticated, showing main UI');
      showAuthenticatedUI();
    }
  } catch (error) {
    console.error('Authentication check failed:', error);
    // Keep the login UI visible on error
    showLoginUI();
  }
}

// Show authenticated UI state
async function showAuthenticatedUI() {
  console.log('Showing authenticated UI');
  // Hide auth screen
  document.getElementById('authScreen').classList.add('hidden');
  
  // Show main content
  document.getElementById('mainContent').classList.remove('hidden');
  
  // Update user avatar
  updateUserAvatar();
  
  // Setup chat threads first
  await setupChatThreads();
  
  // Then automatically create or open a chat with a slight delay
  setTimeout(() => {
    createOrOpenChat();
  }, 500); // Add a slight delay to ensure DOM is ready
}

// Show login UI state
function showLoginUI() {
  console.log('Showing login UI');
  // Show auth screen
  document.getElementById('authScreen').classList.remove('hidden');
  
  // Hide main content
  document.getElementById('mainContent').classList.add('hidden');
  
  // Reset login form - check if it's a proper form element
  const loginForm = document.getElementById('loginForm');
  if (loginForm && typeof loginForm.reset === 'function') {
    loginForm.reset();
  } else if (loginForm) {
    // Manual reset if it's not a form element
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberMeCheckbox = document.getElementById('rememberMe');
    
    if (passwordInput) passwordInput.value = '';
    if (rememberMeCheckbox) rememberMeCheckbox.checked = true;
    // Keep email if it exists for user convenience
  }
  
  // Hide login error
  const loginError = document.getElementById('loginError');
  if (loginError) {
    loginError.classList.add('hidden');
    loginError.textContent = '';
  }
  
  // Update user avatar to not-authenticated state
  updateUserAvatar();
}

// Update user avatar with initial or non-authenticated state
async function updateUserAvatar() {
  try {
    const authData = await window.wizzoApi.getAuthData();
    console.log('Auth data for avatar:', authData);
    
    // Get the avatar button
    const userAvatar = document.getElementById('userAvatar');
    const userInitial = document.getElementById('userInitial');
    
    if (authData && authData.name) {
      // Authenticated state
      // Get first initial for avatar
      const initial = authData.name.charAt(0).toUpperCase();
      
      // Update avatar
      if (userInitial) {
        userInitial.textContent = initial;
      }
      
      // Remove not-authenticated class if present
      if (userAvatar) {
        userAvatar.classList.remove('not-authenticated');
      }
      
      // Update email in settings
      const userEmail = document.getElementById('userEmail');
      if (userEmail) {
        userEmail.textContent = authData.email || 'No email available';
      }
      
      // Update platform URL in settings
      const platformUrl = document.getElementById('platformUrl');
      if (platformUrl) {
        platformUrl.value = window.wizzoApi.baseUrl || '';
      }
    } else {
      // Not authenticated state
      if (userInitial) {
        userInitial.textContent = '?';
      }
      
      // Add not-authenticated class
      if (userAvatar) {
        userAvatar.classList.add('not-authenticated');
      }
    }
  } catch (error) {
    console.error('Failed to update user avatar:', error);
    
    // Ensure not-authenticated state on error
    const userAvatar = document.getElementById('userAvatar');
    const userInitial = document.getElementById('userInitial');
    
    if (userInitial) {
      userInitial.textContent = '?';
    }
    
    if (userAvatar) {
      userAvatar.classList.add('not-authenticated');
    }
  }
}

// Set up event listeners
function setupEventListeners() {
  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    // Handle form submission
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault(); // Prevent default form submission
      handleLogin(e);
    });
    
    // Login button click
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
      loginBtn.addEventListener('click', handleLogin);
    }
  }
  
  // Login form enter key
  const passwordInput = document.getElementById('password');
  if (passwordInput) {
    passwordInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        handleLogin();
      }
    });
  }
  
  // Open main app button
  const openMainAppBtn = document.getElementById('openMainAppBtn');
  if (openMainAppBtn) {
    openMainAppBtn.addEventListener('click', function(e) {
      e.preventDefault();
      chrome.tabs.create({ url: window.wizzoApi.baseUrl });
    });
  }
  
  // Connect button (Open Wizzo App)
  const connectBtn = document.getElementById('connectBtn');
  if (connectBtn) {
    connectBtn.addEventListener('click', function() {
      // Store a flag indicating user was sent to login
      chrome.storage.local.set({ 'wizzo_login_redirect': true });
      // Store the timestamp to know when this happened
      chrome.storage.local.set({ 'wizzo_login_redirect_time': Date.now() });
      // Update UI to show waiting for login
      const connectionMessage = document.getElementById('connectionMessage');
      if (connectionMessage) {
        connectionMessage.textContent = 'Waiting for login...';
      }
      // Open the app
      chrome.tabs.create({ url: window.wizzoApi.baseUrl });
    });
  }
  
  // User avatar click
  const userAvatar = document.getElementById('userAvatar');
  if (userAvatar) {
    userAvatar.addEventListener('click', toggleUserMenu);
  }
  
  // Document click to close user menu
  document.addEventListener('click', function(event) {
    const userMenu = document.getElementById('userMenu');
    const userAvatar = document.getElementById('userAvatar');
    
    if (userMenu && !userMenu.classList.contains('hidden') && 
        !userMenu.contains(event.target) && 
        userAvatar && !userAvatar.contains(event.target)) {
      userMenu.classList.add('hidden');
    }
  });
  
  // Settings button
  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', function() {
      showSettings();
      toggleUserMenu(); // Close user menu
    });
  }
  
  // Close settings button
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener('click', hideSettings);
  }
  
  // Save platform URL button
  const savePlatformUrlBtn = document.getElementById('savePlatformUrlBtn');
  if (savePlatformUrlBtn) {
    savePlatformUrlBtn.addEventListener('click', savePlatformUrl);
  }
  
  // Sign out button
  const signOutBtn = document.getElementById('signOutBtn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', handleSignOut);
  }
  
  // Snooze tab options
  document.querySelectorAll('.snooze-option').forEach(button => {
    button.addEventListener('click', handleSnoozeOption);
  });
  
  // Dropdown items
  document.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', handleDropdownItem);
  });
  
  // Create new chat
  const createChatBtn = document.querySelector('.create-chat-btn');
  if (createChatBtn) {
    createChatBtn.addEventListener('click', function() {
      // Create new chat and ensure we handle any errors
      createNewChat().catch(error => {
        console.error('Error in create chat button handler:', error);
        displayErrorMessage('Failed to create new chat. Please try again.');
      });
    });
  }
  
  // Back button in active chat
  const backBtn = document.querySelector('.back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      // Hide active chat, show thread list
      document.querySelector('.active-chat').classList.add('hidden');
      document.querySelector('.chat-threads').classList.remove('hidden');
    });
  }
  
  // Send button
  const sendButton = document.getElementById('sendButton');
  if (sendButton) {
    sendButton.addEventListener('click', sendChatMessage);
  }
  
  // Enter key in input
  const inputText = document.getElementById('inputText');
  if (inputText) {
    inputText.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        sendChatMessage();
      }
    });
  }
  
  // Add auth change listener
  window.wizzoApi.addAuthListener(handleAuthStateChange);
  
  // Listen for login completed message from background script
  chrome.runtime.onMessage.addListener(function(message) {
    if (message.action === 'loginCompleted') {
      console.log('Received loginCompleted message');
      
      // Update UI to show checking authentication
      const connectionMessage = document.getElementById('connectionMessage');
      if (connectionMessage) {
        connectionMessage.textContent = 'Login detected! Checking authentication...';
      }
      
      // Trigger auth check after a short delay to ensure cookies are available
      setTimeout(async () => {
        try {
          const isAuthenticated = await window.wizzoApi.isAuthenticated();
          console.log('Authentication check after login:', isAuthenticated);
          
          if (isAuthenticated) {
            // Clear the redirect flag
            chrome.storage.local.set({ 'wizzo_login_redirect': false });
            
            // User is authenticated, update UI
            showAuthenticatedUI();
          } else {
            // Still not authenticated
            if (connectionMessage) {
              connectionMessage.textContent = 'Authentication failed. Please try again.';
            }
          }
        } catch (error) {
          console.error('Authentication check failed:', error);
          if (connectionMessage) {
            connectionMessage.textContent = 'Authentication check failed. Please try again.';
          }
        }
      }, 500);
      
      return true; // Keep message channel open for async response
    }
  });
}

// Handle login button click
async function handleLogin(e) {
  // Prevent form submission if called from a form submit event
  if (e && e.preventDefault) {
    e.preventDefault();
  }
  
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const rememberMeCheckbox = document.getElementById('rememberMe');
  const loginError = document.getElementById('loginError');
  const loginBtn = document.getElementById('loginBtn');
  
  if (!emailInput || !passwordInput) return;
  
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const rememberMe = rememberMeCheckbox ? rememberMeCheckbox.checked : false;
  
  // Basic validation
  if (!email || !password) {
    if (loginError) {
      loginError.textContent = 'Please enter both email and password';
      loginError.classList.remove('hidden');
    }
    return;
  }
  
  // Disable login button and show loading state
  if (loginBtn) {
    loginBtn.disabled = true;
    loginBtn.textContent = 'Signing in...';
  }
  
  try {
    console.log('Attempting login with:', email);
    // Attempt login with remember me flag
    const result = await window.wizzoApi.login(email, password, rememberMe);
    console.log('Login result:', result);
    
    if (result.success) {
      // Login successful
      if (loginError) {
        loginError.classList.add('hidden');
      }
      
      // Switch to authenticated UI
      showAuthenticatedUI();
      setupChatThreads();
    } else {
      // Login failed
      if (loginError) {
        loginError.textContent = result.error || 'Login failed. Please try again.';
        loginError.classList.remove('hidden');
      }
    }
  } catch (error) {
    console.error('Login error:', error);
    
    // Show error
    if (loginError) {
      loginError.textContent = 'Login failed. Please try again.';
      loginError.classList.remove('hidden');
    }
  } finally {
    // Re-enable login button
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Sign In';
    }
  }
}

// Handle auth state change
function handleAuthStateChange(isAuthenticated) {
  console.log('Auth state changed:', isAuthenticated);
  if (isAuthenticated) {
    showAuthenticatedUI();
    setupChatThreads();
  } else {
    showLoginUI();
  }
}

// Toggle user menu
function toggleUserMenu() {
  const userMenu = document.getElementById('userMenu');
  if (userMenu) {
    // Check if menu is currently hidden
    const isHidden = userMenu.classList.contains('hidden');
    
    if (isHidden) {
      // We're about to show the menu, update its content based on auth state
      updateUserMenuContent();
    }
    
    // Toggle visibility
    userMenu.classList.toggle('hidden');
  }
}

// Update user menu content based on authentication state
async function updateUserMenuContent() {
  try {
    const authData = await window.wizzoApi.getAuthData();
    const userMenu = document.getElementById('userMenu');
    
    if (!userMenu) return;
    
    // Clear current menu content
    userMenu.innerHTML = '';
    
    if (authData && authData.userId) {
      // User is authenticated - show settings and sign out options
      const settingsBtn = document.createElement('button');
      settingsBtn.id = 'settingsBtn';
      settingsBtn.className = 'menu-item';
      settingsBtn.textContent = 'Settings';
      settingsBtn.addEventListener('click', function() {
        showSettings();
        toggleUserMenu(); // Close user menu
      });
      
      const signOutBtn = document.createElement('button');
      signOutBtn.id = 'signOutBtn';
      signOutBtn.className = 'menu-item';
      signOutBtn.textContent = 'Sign Out';
      signOutBtn.addEventListener('click', handleSignOut);
      
      userMenu.appendChild(settingsBtn);
      userMenu.appendChild(signOutBtn);
    } else {
      // User is not authenticated - show sign in option
      const signInBtn = document.createElement('button');
      signInBtn.id = 'signInBtn';
      signInBtn.className = 'menu-item';
      signInBtn.textContent = 'Sign In';
      signInBtn.addEventListener('click', function() {
        // Focus on email field
        const emailInput = document.getElementById('email');
        if (emailInput) {
          emailInput.focus();
        }
        
        // Close menu
        userMenu.classList.add('hidden');
      });
      
      userMenu.appendChild(signInBtn);
    }
  } catch (error) {
    console.error('Error updating user menu:', error);
    
    // Fallback to non-authenticated menu on error
    const userMenu = document.getElementById('userMenu');
    if (userMenu) {
      userMenu.innerHTML = '';
      
      const signInBtn = document.createElement('button');
      signInBtn.className = 'menu-item';
      signInBtn.textContent = 'Sign In';
      signInBtn.addEventListener('click', function() {
        userMenu.classList.add('hidden');
      });
      
      userMenu.appendChild(signInBtn);
    }
  }
}

// Show settings panel
function showSettings() {
  document.getElementById('settingsScreen').classList.remove('hidden');
  document.getElementById('chatSection').classList.add('hidden');
  
  // Update settings fields
  updateSettingsFields();
}

// Hide settings panel
function hideSettings() {
  document.getElementById('settingsScreen').classList.add('hidden');
  document.getElementById('chatSection').classList.remove('hidden');
}

// Update settings fields with current values
async function updateSettingsFields() {
  try {
    // Update user email
    const authData = await window.wizzoApi.getAuthData();
    if (authData) {
      const userEmail = document.getElementById('userEmail');
      if (userEmail) {
        userEmail.textContent = authData.email || 'No email available';
      }
    }
    
    // Update platform URL
    const platformUrl = document.getElementById('platformUrl');
    if (platformUrl) {
      platformUrl.value = window.wizzoApi.baseUrl || '';
    }
  } catch (error) {
    console.error('Failed to update settings fields:', error);
  }
}

// Save platform URL
async function savePlatformUrl() {
  const platformUrlInput = document.getElementById('platformUrl');
  if (!platformUrlInput) return;
  
  const url = platformUrlInput.value.trim();
  if (!url) {
    displayErrorMessage('Please enter a valid URL');
    return;
  }
  
  try {
    // Validate URL format
    new URL(url);
    
    // Save URL (update this approach)
    window.wizzoApi.baseUrl = url;
    displaySuccessMessage('Platform URL saved successfully');
    
    // Refresh authentication check and chat threads
    checkAuthentication();
  } catch (error) {
    console.error('Save platform URL error:', error);
    displayErrorMessage('Invalid URL format');
  }
}

// Handle sign out
async function handleSignOut() {
  try {
    // Close user menu
    const userMenu = document.getElementById('userMenu');
    if (userMenu) {
      userMenu.classList.add('hidden');
    }
    
    // Perform logout
    await window.wizzoApi.logout();
    
    // Show login UI
    showLoginUI();
  } catch (error) {
    console.error('Sign out error:', error);
    displayErrorMessage('Failed to sign out');
  }
}

// Setup chat threads
async function setupChatThreads() {
  try {
    console.log('Setting up chat threads...');
    // Get chat history from API
    const history = await window.wizzoApi.getChatHistory();
    console.log('Chat history:', history);
    displayChatThreads(history);
  } catch (error) {
    console.error('Failed to get chat history:', error);
    displayErrorMessage('Failed to load chat history. Please ensure you are logged in to the main application.');
  }
}

// Display chat threads
function displayChatThreads(history) {
  const threadList = document.getElementById('thread-list');
  if (!threadList) return;
  
  threadList.innerHTML = '';
  
  if (!history || history.length === 0) {
    threadList.innerHTML = '<div class="no-chats">No chat threads found. Create a new chat to get started.</div>';
    return;
  }
  
  history.forEach(chat => {
    const threadItem = document.createElement('div');
    threadItem.className = 'thread-item';
    threadItem.dataset.id = chat.id;
    
    const title = document.createElement('div');
    title.className = 'thread-title';
    title.textContent = chat.title || 'Untitled Chat';
    
    const date = document.createElement('div');
    date.className = 'thread-date';
    date.textContent = formatDate(chat.updatedAt || chat.createdAt);
    
    threadItem.appendChild(title);
    threadItem.appendChild(date);
    
    threadItem.addEventListener('click', () => {
      openChatThread(chat.id);
    });
    
    threadList.appendChild(threadItem);
  });
}

// Format date for display
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  
  // If today, show time
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // If this year, show month and day
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  
  // Otherwise, show full date
  return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
}

// Open a specific chat thread
async function openChatThread(chatId) {
  try {
    // Show loading state
    document.getElementById('chat-messages').innerHTML = '<div class="loading-spinner"></div>';
    
    // Show active chat view, hide threads list
    document.querySelector('.chat-threads').classList.add('hidden');
    document.querySelector('.active-chat').classList.remove('hidden');
    
    // Get chat details from API
    console.log('Fetching chat data for ID:', chatId);
    let chatData;
    
    try {
      chatData = await window.wizzoApi.getChatById(chatId);
      console.log('Received chat data:', chatData);
    } catch (chatError) {
      console.error('Error fetching chat data:', chatError);
      // Show error but don't throw yet - we'll create a fallback approach
      document.getElementById('chat-messages').innerHTML = `
        <div class="error-message">
          Error loading chat data. Attempting to create new chat instead...
        </div>
      `;
      
      // Try to create a new chat as fallback
      try {
        console.log('Creating a new chat as fallback');
        chatData = await window.wizzoApi.createChat('New Chat');
        console.log('Created new fallback chat:', chatData);
        
        // If we get here, we have a new chat
        document.getElementById('chat-messages').innerHTML = `
          <div class="system-message">
            Created a new chat. The previous chat data could not be loaded.
          </div>
        `;
      } catch (fallbackError) {
        console.error('Error creating fallback chat:', fallbackError);
        throw chatError; // Now throw the original error
      }
    }
    
    // Update active chat with data
    document.getElementById('active-chat-title').textContent = chatData.title || 'Chat';
    
    // Store current chat ID
    document.querySelector('.active-chat').dataset.chatId = chatData.id || chatId;
    
    // Display messages
    displayChatMessages(chatData.messages || []);
  } catch (error) {
    console.error('Failed to open chat thread:', error);
    displayErrorMessage('Failed to load chat. Please try again.');
    
    // Go back to thread list
    document.querySelector('.active-chat').classList.add('hidden');
    document.querySelector('.chat-threads').classList.remove('hidden');
  }
}

// Display chat messages
function displayChatMessages(messages) {
  const chatMessages = document.getElementById('chat-messages');
  chatMessages.innerHTML = '';
  
  if (!messages || messages.length === 0) {
    chatMessages.innerHTML = '<div class="no-messages">No messages yet. Start the conversation!</div>';
    return;
  }
  
  messages.forEach(message => {
    const messageElement = document.createElement('div');
    messageElement.className = `message message-${message.role}`;
    
    // Create message content element
    const content = document.createElement('div');
    content.className = 'message-content';
    content.textContent = message.content;
    
    messageElement.appendChild(content);
    chatMessages.appendChild(messageElement);
  });
  
  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Create a new chat
async function createNewChat() {
  console.log('Creating new chat...');
  try {
    // Show loading indicator
    document.getElementById('chat-messages').innerHTML = '<div class="loading-spinner"></div>';
    document.querySelector('.chat-threads').classList.add('hidden');
    document.querySelector('.active-chat').classList.remove('hidden');
    
    // Create a new chat
    const newChat = await window.wizzoApi.createChat('New Chat');
    console.log('New chat created:', newChat);
    
    // Refresh chat list
    await setupChatThreads();
    
    // Open the new chat
    await openChatThread(newChat.id);
    
    return newChat;
  } catch (error) {
    console.error('Failed to create new chat:', error);
    // Go back to thread list
    document.querySelector('.active-chat').classList.add('hidden');
    document.querySelector('.chat-threads').classList.remove('hidden');
    throw error;
  }
}

// Send a chat message
async function sendChatMessage() {
  // Ensure we have an open chat before sending
  const activeChatElement = document.querySelector('.active-chat');
  if (activeChatElement.classList.contains('hidden')) {
    // No chat is open, attempt to create one first
    try {
      await createNewChat();
    } catch (error) {
      console.error('Failed to create chat before sending message:', error);
      displayErrorMessage('Please create a chat first');
      return;
    }
  }
  
  const inputField = document.getElementById('inputText');
  const chatMessages = document.getElementById('chat-messages');
  
  if (!inputField || !chatMessages || !activeChatElement) return;
  
  const message = inputField.value.trim();
  const chatId = activeChatElement.dataset.chatId;
  
  if (!message || !chatId) return;
  
  try {
    // Add user message to UI
    const userMessageElement = document.createElement('div');
    userMessageElement.className = 'message message-user';
    userMessageElement.innerHTML = `<div class="message-content">${message}</div>`;
    chatMessages.appendChild(userMessageElement);
    
    // Clear input field
    inputField.value = '';
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Create a temporary loading message
    const loadingElement = document.createElement('div');
    loadingElement.className = 'message message-assistant message-loading';
    loadingElement.innerHTML = '<div class="message-content"><div class="loading-dots"><span>.</span><span>.</span><span>.</span></div></div>';
    chatMessages.appendChild(loadingElement);
    
    // Scroll to bottom again
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Prepare message for API
    const userMessage = {
      role: 'user',
      content: message,
    };
    
    // Get all existing messages plus the new one
    const allMessages = Array.from(document.querySelectorAll('.message'))
      .map(el => {
        const role = el.classList.contains('message-user') ? 'user' : 
                    el.classList.contains('message-assistant') ? 'assistant' : 'system';
        const content = el.querySelector('.message-content')?.textContent || '';
        return { role, content };
      })
      .filter(m => m.content && m.content !== '...' && !m.content.includes('...'));
    
    // Choose default model
    const selectedChatModel = 'gpt-4o-mini';
    
    // Stream response
    let assistantResponse = '';
    let assistantMessageElement = null;

    window.wizzoApi.streamChatResponse(
      chatId,
      allMessages,
      selectedChatModel,
      (data) => {
        // Process streaming data
        if (data.type === 'text' && data.text) {
          // Remove loading message if it exists
          if (loadingElement && loadingElement.parentNode) {
            loadingElement.remove();
          }
          
          // Create assistant message element if it doesn't exist
          if (!assistantMessageElement) {
            assistantMessageElement = document.createElement('div');
            assistantMessageElement.className = 'message message-assistant';
            assistantMessageElement.innerHTML = '<div class="message-content"></div>';
            chatMessages.appendChild(assistantMessageElement);
          }
          
          // Update assistant message content
          assistantResponse += data.text;
          assistantMessageElement.querySelector('.message-content').textContent = assistantResponse;
          
          // Scroll to bottom
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }
      },
      (error) => {
        console.error('Stream error:', error);
        
        // Remove loading message
        if (loadingElement && loadingElement.parentNode) {
          loadingElement.remove();
        }
        
        // Show error message
        displayErrorMessage('Failed to get response. Please try again.');
      },
      () => {
        // Stream complete
        console.log('Stream complete');
        
        // Remove loading message if it still exists
        if (loadingElement && loadingElement.parentNode) {
          loadingElement.remove();
        }
        
        // Refresh chat thread list
        setupChatThreads();
      }
    );
  } catch (error) {
    console.error('Failed to send message:', error);
    displayErrorMessage('Failed to send message. Please try again.');
  }
}

// Display error message
function displayErrorMessage(message) {
  const errorElement = document.createElement('div');
  errorElement.className = 'error-message';
  errorElement.textContent = message;
  
  document.querySelector('.container').appendChild(errorElement);
  
  // Remove after 5 seconds
  setTimeout(() => {
    if (errorElement && errorElement.parentNode) {
      errorElement.remove();
    }
  }, 5000);
}

// Display success message
function displaySuccessMessage(message) {
  const messageElement = document.createElement('div');
  messageElement.className = 'success-message';
  messageElement.textContent = message;
  
  document.querySelector('.container').appendChild(messageElement);
  
  // Remove after 5 seconds
  setTimeout(() => {
    if (messageElement && messageElement.parentNode) {
      messageElement.remove();
    }
  }, 5000);
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
    // Add active class to indicate snoozing is in progress
    document.querySelectorAll('.snooze-option').forEach(btn => {
      if (btn.textContent.trim() === duration) {
        btn.classList.add('active');
      }
    });
    
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
      const tabUrls = response.snoozedTabs.map(tab => tab.url).join('\n');
      
      // Add to chat as system message
      const chatMessages = document.getElementById('chat-messages');
      if (chatMessages && !chatMessages.classList.contains('hidden')) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message message-system';
        messageElement.innerHTML = `<div class="message-content">✨ ${response.snoozedTabs.length} tabs magically snoozed for ${response.snoozedTabs[0].duration} until ${formattedWakeTime}:\n${tabUrls}</div>`;
        chatMessages.appendChild(messageElement);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
      } else {
        displaySuccessMessage(`${response.snoozedTabs.length} tabs magically snoozed for ${response.snoozedTabs[0].duration}`);
      }
    } else if (response.tabInfo) {
      // Single tab was snoozed
      const formattedWakeTime = new Date(response.tabInfo.wakeTime).toLocaleString();
      
      // Add to chat as system message
      const chatMessages = document.getElementById('chat-messages');
      if (chatMessages && !chatMessages.classList.contains('hidden')) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message message-system';
        messageElement.innerHTML = `<div class="message-content">✨ Tab magically snoozed for ${response.tabInfo.duration} until ${formattedWakeTime}:\n${response.tabInfo.url}</div>`;
        chatMessages.appendChild(messageElement);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
      } else {
        displaySuccessMessage(`Tab magically snoozed for ${response.tabInfo.duration}`);
      }
    } else {
      // Generic success message
      displaySuccessMessage('Tabs successfully snoozed!');
    }
  } else {
    displayErrorMessage(`Failed to snooze tabs: ${response.error || 'Unknown error'}`);
  }
}
