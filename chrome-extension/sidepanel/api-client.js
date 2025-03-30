// API Client for communication with the main Wizzo app
class WizzoApiClient {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.initialized = true;
    this.authListeners = [];
    
    // Log initialization
    console.log(`API client initialized with base URL: ${this.baseUrl}`);
    
    // Create default chat when authenticated
    this.addAuthListener(async (isAuthenticated) => {
      if (isAuthenticated) {
        try {
          // Try to automatically create a new chat
          await this.createDefaultChat();
        } catch (error) {
          console.error('Error creating default chat:', error);
        }
      }
    });
  }

  // Get authentication headers
  async getHeaders() {
    // Get auth token if available
    const auth = await this.getAuthData();

    const headers = {
      'Content-Type': 'application/json',
    };

    if (auth && auth.token) {
      headers['Authorization'] = `Bearer ${auth.token}`;
    }

    return headers;
  }

  // Get the current auth data
  async getAuthData() {
    return new Promise(resolve => {
      chrome.storage.local.get(['wizzo_auth_data'], (result) => {
        resolve(result.wizzo_auth_data || null);
      });
    });
  }

  // Check if user is authenticated
  async isAuthenticated() {
    // First check existing stored auth data
    const authData = await this.getAuthData();
    
    // Always check with server regardless of local auth data
    try {
      console.log('Checking authentication with server...');
      // Ensure we're authenticated by checking session
      const session = await fetch(`${this.baseUrl}/api/auth/session`, { 
        credentials: 'include',
        cache: 'no-cache' // Force fresh request
      });
      
      console.log('Session response status:', session.status);
      
      if (!session.ok) {
        console.error('Failed to get session:', session.status, session.statusText);
        await this.clearAuthData();
        return false;
      }
      
      const sessionData = await session.json();
      console.log('Session data:', sessionData);
      
      if (!sessionData || !sessionData.user) {
        console.error('No valid user in session');
        await this.clearAuthData();
        return false;
      }
      
      // We have a valid session - update local auth data if needed
      if (!authData || authData.userId !== sessionData.user.id) {
        console.log('Updating local auth data from session');
        const newAuthData = {
          token: sessionData.accessToken || 'session-auth',
          userId: sessionData.user.id,
          email: sessionData.user.email,
          name: sessionData.user.name || sessionData.user.email.split('@')[0],
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
        };
        
        await this.saveAuthData(newAuthData, authData?.rememberMe || false);
      }
      
      // Token is valid and user is authenticated
      return true;
    } catch (error) {
      console.error('Authentication check error:', error);
      return false;
    }
  }

  // Login with email and password
  async login(email, password, rememberMe = true) {
    try {
      console.log(`Attempting login for ${email}`);
      console.log('Remember me:', rememberMe);
      
      // First check if Next Auth CSRF token is needed
      const csrfResponse = await fetch(`${this.baseUrl}/api/auth/csrf`, {
        credentials: 'include'
      });
      
      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.csrfToken;
      
      console.log('Obtained CSRF token:', csrfToken);
      
      // Use Next.js Auth system - first create cookie-based session
      const authResponse = await fetch(`${this.baseUrl}/api/auth/callback/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          email, 
          password,
          csrfToken,
          callbackUrl: `${this.baseUrl}` 
        }),
        redirect: 'manual' // Prevent automatic redirects to better handle errors
      });
      
      // For debugging response
      console.log('Login response status:', authResponse.status);
      
      if (authResponse.status === 401) {
        return { success: false, error: 'Invalid email or password' };
      }
      
      // Check for redirect to error page
      const location = authResponse.headers.get('location');
      if (location && location.includes('error=')) {
        console.error('Login failed with redirect error:', location);
        return { 
          success: false, 
          error: 'Invalid email or password. Please try again.'
        };
      }
      
      // Only proceed if we got a redirect (successful auth)
      if (authResponse.status !== 302) {
        console.error('Unexpected auth response status:', authResponse.status);
        return { success: false, error: 'Login failed. Please try again.' };
      }
      
      // Check session to confirm login success
      const sessionResponse = await fetch(`${this.baseUrl}/api/auth/session`, {
        credentials: 'include'
      });
      
      if (!sessionResponse.ok) {
        console.error('Failed to get session after login');
        return { success: false, error: 'Login failed. Please try again.' };
      }
      
      const sessionData = await sessionResponse.json();
      console.log('Session data after login:', sessionData);
      
      if (!sessionData || !sessionData.user) {
        console.error('No user in session after login');
        return { success: false, error: 'Login failed. Server rejected credentials.' };
      }
      
      // Successfully authenticated
      const authData = {
        token: sessionData.accessToken || 'session-auth',
        userId: sessionData.user.id,
        email: sessionData.user.email,
        name: sessionData.user.name || email.split('@')[0],
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
      };
      
      await this.saveAuthData(authData, rememberMe);
      
      // Save credentials if rememberMe is true
      if (rememberMe) {
        await this.saveCredentials(email, password);
      } else {
        await this.clearCredentials();
      }
      
      // Notify listeners
      this.notifyAuthChanged(true);
      
      return { success: true, userId: authData.userId, name: authData.name };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Authentication failed. Please try again.' };
    }
  }
  
  // Save authentication data
  async saveAuthData(authData, rememberMe = false) {
    console.log('Saving auth data with remember me:', rememberMe);
    
    // Add rememberMe flag to auth data
    const enhancedAuthData = {
      ...authData,
      rememberMe
    };
    
    return new Promise(resolve => {
      chrome.storage.local.set({ 'wizzo_auth_data': enhancedAuthData }, resolve);
    });
  }
  
  // Save user credentials for remember me feature
  async saveCredentials(email, password) {
    return new Promise(resolve => {
      chrome.storage.local.set({ 
        'wizzo_saved_credentials': { 
          email, 
          password: btoa(password) // Simple encoding, not truly secure but sufficient for remember me
        } 
      }, resolve);
    });
  }
  
  // Clear saved credentials
  async clearCredentials() {
    return new Promise(resolve => {
      chrome.storage.local.remove('wizzo_saved_credentials', resolve);
    });
  }
  
  // Clear authentication data (logout)
  async clearAuthData() {
    return new Promise(resolve => {
      chrome.storage.local.remove('wizzo_auth_data', resolve);
    });
  }
  
  // Get saved credentials
  async getSavedCredentials() {
    return new Promise(resolve => {
      chrome.storage.local.get(['wizzo_saved_credentials'], (result) => {
        const creds = result.wizzo_saved_credentials;
        if (creds && creds.email && creds.password) {
          try {
            // Decode password
            creds.password = atob(creds.password);
          } catch (e) {
            console.error('Error decoding password:', e);
            resolve(null);
            return;
          }
          resolve(creds);
        } else {
          resolve(null);
        }
      });
    });
  }
  
  // Logout user
  async logout() {
    try {
      // Get auth data for logging
      const authData = await this.getAuthData();
      const userId = authData?.userId;
      
      // Call the Next.js Auth logout endpoint
      try {
        await fetch(`${this.baseUrl}/api/auth/signout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({})
        });
      } catch (e) {
        console.log('Logout from server failed, continuing with local logout');
      }
      
      // Check if we should clear credentials based on remember me setting
      const rememberMe = authData?.rememberMe;
      if (!rememberMe) {
        await this.clearCredentials();
      }
      
      // Clear authentication data
      await this.clearAuthData();
      
      // Notify listeners
      this.notifyAuthChanged(false);
      
      console.log('Logout successful for user:', userId);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: 'Failed to log out' };
    }
  }
  
  // Add auth change listener
  addAuthListener(callback) {
    this.authListeners.push(callback);
  }
  
  // Remove auth change listener
  removeAuthListener(callback) {
    this.authListeners = this.authListeners.filter(cb => cb !== callback);
  }
  
  // Notify all listeners of auth change
  notifyAuthChanged(isAuthenticated) {
    this.authListeners.forEach(callback => {
      try {
        callback(isAuthenticated);
      } catch (error) {
        console.error('Error in auth listener:', error);
      }
    });
  }

  async request(endpoint, options = {}) {
    // Skip auth check for auth-related endpoints
    if (endpoint !== '/api/auth/session' && endpoint !== '/api/auth/csrf') {
      // First check if we're actually authenticated
      try {
        const isAuth = await this.isAuthenticated();
        if (!isAuth) {
          // Notify auth change and fail
          this.notifyAuthChanged(false);
          throw new Error('Authentication required. Please log in first.');
        }
      } catch (authCheckError) {
        console.warn('Auth check failed, proceeding anyway:', authCheckError);
        // Continue despite auth check failure - the server will enforce auth if needed
      }
    }
    
    const url = `${this.baseUrl}${endpoint}`;
    const headers = await this.getHeaders();
    
    const fetchOptions = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
      credentials: 'include'
    };

    try {
      console.log(`Making API request to ${url}`, fetchOptions);
      const response = await fetch(url, fetchOptions);
      
      // Handle errors better
      if (!response.ok) {
        const errorText = await response.text();
        
        // Special handling for 401/403 auth errors
        if (response.status === 401 || response.status === 403) {
          console.log('Unauthorized request, triggering auth change');
          this.notifyAuthChanged(false);
          throw new Error('Authentication required. Please log in to the main application.');
        }
        
        console.error(`API request failed (${response.status} ${response.statusText}):`, errorText);
        throw new Error(`API request failed: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
      }
      
      // For non-JSON responses, return the raw response
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      console.error(`API request error for ${endpoint}:`, error);
      throw error;
    }
  }

  // Chat endpoints
  async getChatHistory() {
    return this.request('/api/history');
  }

  async getChatById(chatId) {
    // Try the correct endpoint format - the previous one was returning 404
    try {
      return this.request(`/api/chat?id=${chatId}`);
    } catch (error) {
      console.error('Failed to get chat with primary endpoint:', error);
      // Fallback to alternate endpoint formats if needed
      try {
        return this.request(`/api/history/${chatId}`);
      } catch (fallbackError) {
        console.error('Failed to get chat with fallback endpoint:', fallbackError);
        throw error; // Throw the original error
      }
    }
  }

  async createMessage(chatId, message, model = 'gpt-4o-mini') {
    return this.request('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        id: chatId,
        messages: [message],
        selectedChatModel: model,
      }),
    });
  }

  async streamChatResponse(chatId, messages, selectedChatModel, onMessage, onError, onFinish) {
    const url = `${this.baseUrl}/api/chat`;
    const headers = await this.getHeaders();
    
    // Always check authentication first
    if (!(await this.isAuthenticated())) {
      if (onError) {
        onError(new Error('Authentication required. Please log in first.'));
      }
      this.notifyAuthChanged(false);
      return;
    }
    
    const fetchOptions = {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: chatId,
        messages,
        selectedChatModel,
      }),
      credentials: 'include'
    };

    try {
      // First check authentication
      const isAuthenticated = await this.isAuthenticated();
      if (!isAuthenticated) {
        console.log('Not authenticated, showing login prompt');
        if (onError) {
          onError(new Error('Authentication required. Please log in first.'));
        }
        this.notifyAuthChanged(false);
        return;
      }
      
      console.log(`Streaming chat request to ${url}`, { 
        chatId, 
        messagesCount: messages.length, 
        model: selectedChatModel 
      });
      
      const response = await fetch(url, fetchOptions);
      
      if (response.status === 401) {
        this.notifyAuthChanged(false);
        throw new Error('Authentication required. Please log in.');
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      if (!response.body) {
        throw new Error('Response body stream not available');
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let buffer = '';
      let done = false;
      
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        
        if (done) {
          if (onFinish) {
            onFinish();
          }
          break;
        }
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process and clear buffer
        buffer = this.processStreamBuffer(buffer, onMessage);
      }
    } catch (error) {
      console.error('Stream error:', error);
      if (onError) {
        onError(error);
      }
    }
  }
  
  processStreamBuffer(buffer, onMessage) {
    // Split buffer by newlines and process each line
    const lines = buffer.split('\n');
    
    // Keep the last line in the buffer (it might be incomplete)
    const remainingBuffer = lines.pop();
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      try {
        // Lines starting with "data: " contain the JSON data
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6);
          
          // Skip "ping" messages
          if (jsonStr === '[DONE]') continue;
          
          const data = JSON.parse(jsonStr);
          onMessage(data);
        }
      } catch (error) {
        console.error('Error processing stream data:', error, line);
      }
    }
    
    return remainingBuffer;
  }

  // Creates a new chat
  async createChat(title) {
    try {
      const generatedId = this.generateUUID();
      console.log(`Creating new chat with ID: ${generatedId}`);
      
      try {
        // First try the new dedicated endpoint
        const response = await this.request('/api/chat/create', {
          method: 'POST',
          body: JSON.stringify({
            id: generatedId,
            title: title || 'New Chat',
          }),
        });
        
        console.log('Chat created successfully:', response);
        return { id: generatedId, ...response };
      } catch (error) {
        console.warn('Failed to create chat using /api/chat/create endpoint, trying fallback method:', error);
        
        // Fallback: Create chat by directly saving it via the chat interface
        // This is a workaround since the /api/chat/create endpoint might not be fully implemented
        await this.request('/api/chat', {
          method: 'POST',
          body: JSON.stringify({
            id: generatedId,
            messages: [{role: 'system', content: 'Chat initialized'}],
            selectedChatModel: 'gpt-4o-mini',
          }),
        });
        
        console.log('Chat created using fallback method');
        return { id: generatedId, title: title || 'New Chat' };
      }
    } catch (error) {
      console.error('All chat creation methods failed:', error);
      throw error;
    }
  }
  
  // Create a default chat automatically
  async createDefaultChat() {
    try {
      // Check if we already have chats
      const history = await this.getChatHistory().catch(() => []);
      
      // If there are no chats or we couldn't fetch them, create a default one
      if (!history || history.length === 0) {
        console.log('No chats found, creating a default chat');
        return await this.createChat('New Chat');
      } else {
        // We have existing chats, return the first one
        console.log('Using existing chat:', history[0].id);
        return history[0];
      }
    } catch (error) {
      console.error('Error creating default chat:', error);
      // Still try to create a new chat even if we had an error
      try {
        console.log('Attempting to create chat after error');
        return await this.createChat('New Chat');
      } catch (fallbackError) {
        console.error('Fallback chat creation also failed:', fallbackError);
        return null;
      }
    }
  }

  // Delete a chat
  async deleteChat(chatId) {
    return this.request(`/api/chat?id=${chatId}`, {
      method: 'DELETE',
    });
  }
  
  // Helper function to generate UUID
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

// Create and export a singleton instance
window.wizzoApi = new WizzoApiClient();
