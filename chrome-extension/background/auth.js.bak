// Authentication system implementation

import { secureStore } from './storage.js';
import { trackError } from './errorTracking.js';

const AUTH_DATA_KEY = 'wizzo_auth_data';
let API_BASE_URL = 'https://api.wizzo.com'; // Will be updated from settings

// Initialize the authentication system
export async function initAuthSystem() {
  console.log('Initializing authentication system...');
  
  // Get platform URL from settings
  const settings = await new Promise(resolve => {
    chrome.storage.local.get(['settings'], (result) => {
      resolve(result.settings || {});
    });
  });
  
  // Update API base URL from settings
  if (settings.platformUrl) {
    // Convert platformUrl to API base URL
    const url = new URL(settings.platformUrl);
    API_BASE_URL = `${url.protocol}//${url.host}`;
  }
  
  // Check for existing authentication
  const authStatus = await checkAuthStatus();
  console.log('Auth status:', authStatus.isAuthenticated ? 'Authenticated' : 'Not authenticated');
  
  return authStatus;
}

// Perform user login
export async function login(email, password) {
  try {
    console.log('Attempting login for:', email);
    
    // Call the authentication API
    const response = await fetch(`${API_BASE_URL}/api/extension/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Login failed:', data.error);
      return { success: false, error: data.error || 'Login failed' };
    }
    
    // Calculate token expiry time (default 24 hours if not specified)
    const expiresIn = data.expiresIn || 86400; // 24 hours in seconds
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);
    
    // Store authentication data
    const authData = {
      token: data.token,
      refreshToken: data.refreshToken,
      userId: data.userId || data.user?.id,
      email: email,
      expiresAt: expiresAt.toISOString()
    };
    
    await secureStore().set(AUTH_DATA_KEY, authData);
    
    console.log('Login successful for user:', authData.userId);
    return { success: true, userId: authData.userId };
  } catch (error) {
    trackError('login', error);
    return { success: false, error: 'Authentication failed. Please try again.' };
  }
}

// Check if the user is authenticated
export async function checkAuthStatus() {
  try {
    const authData = await secureStore().get(AUTH_DATA_KEY);
    
    if (!authData || !authData.token) {
      return { isAuthenticated: false };
    }
    
    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(authData.expiresAt);
    
    if (now >= expiresAt) {
      console.log('Token expired, attempting to refresh...');
      return refreshAuthToken(authData.refreshToken);
    }
    
    // Validate token with backend (optional but recommended)
    try {
      const validationResult = await validateToken(authData.token);
      return { 
        isAuthenticated: validationResult.valid, 
        userId: authData.userId,
        email: authData.email
      };
    } catch (validationError) {
      console.warn('Token validation failed:', validationError);
      return { isAuthenticated: false, error: 'Invalid session' };
    }
  } catch (error) {
    trackError('checkAuthStatus', error);
    return { isAuthenticated: false, error: 'Failed to check authentication status' };
  }
}

// Refresh the authentication token
async function refreshAuthToken(refreshToken) {
  try {
    console.log('Refreshing authentication token...');
    
    const response = await fetch(`${API_BASE_URL}/api/extension/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Token refresh failed:', data.error);
      await secureStore().remove(AUTH_DATA_KEY);
      return { isAuthenticated: false, error: 'Session expired. Please log in again.' };
    }
    
    // Calculate new token expiry time
    const expiresIn = data.expiresIn || 86400; // 24 hours in seconds
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);
    
    // Get existing auth data to preserve fields like email
    const existingAuthData = await secureStore().get(AUTH_DATA_KEY) || {};
    
    // Update authentication data
    const authData = {
      ...existingAuthData,
      token: data.token,
      refreshToken: data.refreshToken || existingAuthData.refreshToken,
      expiresAt: expiresAt.toISOString()
    };
    
    await secureStore().set(AUTH_DATA_KEY, authData);
    
    console.log('Token refresh successful');
    return { 
      isAuthenticated: true, 
      userId: authData.userId,
      email: authData.email
    };
  } catch (error) {
    trackError('refreshAuthToken', error);
    await secureStore().remove(AUTH_DATA_KEY);
    return { isAuthenticated: false, error: 'Failed to refresh authentication' };
  }
}

// Validate token with the backend
async function validateToken(token) {
  const response = await fetch(`${API_BASE_URL}/api/extension/validate`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Token validation failed');
  }
  
  return { valid: data.valid, userId: data.userId };
}

// Log the user out
export async function logout() {
  try {
    console.log('Logging out user...');
    
    // Get auth data for logging
    const authData = await secureStore().get(AUTH_DATA_KEY);
    const userId = authData?.userId;
    
    // Clear authentication data
    await secureStore().remove(AUTH_DATA_KEY);
    
    console.log('Logout successful for user:', userId);
    return { success: true };
  } catch (error) {
    trackError('logout', error);
    return { success: false, error: 'Failed to log out' };
  }
}

// Get auth headers for API requests
export async function getAuthHeaders() {
  try {
    const authData = await secureStore().get(AUTH_DATA_KEY);
    
    if (authData && authData.token) {
      return {
        'Authorization': `Bearer ${authData.token}`,
        'Content-Type': 'application/json'
      };
    }
    
    return { 'Content-Type': 'application/json' };
  } catch (error) {
    trackError('getAuthHeaders', error);
    return { 'Content-Type': 'application/json' };
  }
}

// Export the API base URL
export { API_BASE_URL };
