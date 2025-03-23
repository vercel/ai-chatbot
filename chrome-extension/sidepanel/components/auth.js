// Authentication components for side panel

/**
 * Initialize authentication functionality
 * @param {Object} params - Parameters for initialization
 * @param {Function} params.onLoginSuccess - Callback when login succeeds
 * @param {Function} params.onLogoutSuccess - Callback when logout succeeds
 * @returns {Object} - Authentication controller methods
 */
export function initAuth({ onLoginSuccess, onLogoutSuccess }) {
  const loginForm = document.getElementById('loginForm');
  const mainContent = document.getElementById('mainContent');
  const loginButton = document.getElementById('loginButton');
  const logoutButton = document.getElementById('logoutButton');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const loginError = document.getElementById('loginError');
  const userEmail = document.getElementById('userEmail');
  const openSignupLink = document.getElementById('openSignupLink');

  // Event listeners
  loginButton.addEventListener('click', handleLogin);
  logoutButton.addEventListener('click', handleLogout);
  openSignupLink.addEventListener('click', openSignupPage);
  
  // Support for Enter key in login form
  passwordInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
      handleLogin();
    }
  });

  async function handleLogin() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
      showLoginError('Please enter both email and password');
      return;
    }
    
    // Show loading state
    loginButton.disabled = true;
    loginButton.textContent = 'Signing in...';
    loginError.style.display = 'none';
    
    try {
      // Send login request to background script
      const response = await chrome.runtime.sendMessage({ 
        action: 'login', 
        email, 
        password 
      });
      
      // Reset form
      loginButton.disabled = false;
      loginButton.textContent = 'Sign In';
      
      if (response && response.success) {
        emailInput.value = '';
        passwordInput.value = '';
        
        // Update UI
        userEmail.textContent = email;
        showMainContent();
        
        // Call success callback
        if (typeof onLoginSuccess === 'function') {
          onLoginSuccess(response);
        }
      } else {
        showLoginError(response?.error || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      loginButton.disabled = false;
      loginButton.textContent = 'Sign In';
      showLoginError('Connection error. Please try again.');
      console.error('Login error:', error);
    }
  }

  async function handleLogout() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'logout' });
      
      if (response && response.success) {
        showLoginForm();
        
        // Call success callback
        if (typeof onLogoutSuccess === 'function') {
          onLogoutSuccess();
        }
      } else {
        console.error('Logout failed:', response?.error);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  function openSignupPage() {
    chrome.storage.local.get(['settings'], function(result) {
      const settings = result.settings || {};
      const platformUrl = settings.platformUrl || 'https://wizzo.com';
      chrome.tabs.create({ url: `${platformUrl}/signup` });
    });
  }

  function showLoginError(message) {
    loginError.textContent = message;
    loginError.style.display = 'block';
  }
  
  function showLoginForm() {
    loginForm.style.display = 'block';
    mainContent.style.display = 'none';
    userEmail.textContent = '';
  }
  
  function showMainContent() {
    loginForm.style.display = 'none';
    mainContent.style.display = 'block';
  }
  
  /**
   * Check the current authentication status
   * @returns {Promise<Object>} Authentication status
   */
  async function checkAuthStatus() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'checkAuth' });
      
      if (response && response.isAuthenticated) {
        userEmail.textContent = response.email || 'User';
        showMainContent();
        return { isAuthenticated: true, email: response.email };
      } else {
        showLoginForm();
        return { isAuthenticated: false };
      }
    } catch (error) {
      console.error('Auth check error:', error);
      showLoginForm();
      return { isAuthenticated: false, error };
    }
  }
  
  // Return public methods
  return {
    checkAuthStatus,
    logout: handleLogout,
    showLoginForm,
    showMainContent
  };
}
