// Error tracking system

const ERROR_LOG_KEY = 'wizzo_error_log';
const MAX_ERROR_LOG_SIZE = 50;

// Initialize error tracking
export async function initErrorTracking() {
  console.log('Initializing error tracking...');
  
  try {
    // Check if we're in browser context
    if (typeof window !== 'undefined') {
      // Set up global error handler
      window.onerror = function(message, source, lineno, colno, error) {
        trackError('window.onerror', { message, source, lineno, colno, stack: error?.stack });
        return false;
      };
      
      // Set up unhandled promise rejection handler
      window.onunhandledrejection = function(event) {
        trackError('unhandledRejection', { 
          reason: event.reason?.message || event.reason,
          stack: event.reason?.stack 
        });
      };
    } else {
      console.log('Not in window context, skipping global error handlers');
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing error tracking:', error);
    return false;
  }
}

// Track an error with details
export async function trackError(source, error) {
  try {
    const timestamp = new Date().toISOString();
    
    // Format the error object
    let errorDetails = {
      source,
      timestamp,
      message: error?.message || error
    };
    
    if (error?.stack) {
      errorDetails.stack = error.stack;
    }
    
    if (typeof error === 'object') {
      try {
        // Add any additional properties without risking circular references
        const serialized = JSON.parse(JSON.stringify(error));
        errorDetails = { ...errorDetails, ...serialized };
      } catch (e) {
        // If serialization fails, use basic error info
      }
    }
    
    console.error(`[${source}] Error:`, errorDetails);
    
    // Get existing error log
    const { wizzo_error_log = [] } = await new Promise(resolve => {
      chrome.storage.local.get([ERROR_LOG_KEY], resolve);
    });
    
    // Add the new error to the log
    const updatedLog = [errorDetails, ...wizzo_error_log].slice(0, MAX_ERROR_LOG_SIZE);
    
    // Save the updated log
    await new Promise(resolve => {
      chrome.storage.local.set({ [ERROR_LOG_KEY]: updatedLog }, resolve);
    });
    
    // Save additional debug information
    await new Promise(resolve => {
      chrome.storage.local.set({
        wizzo_debug: {
          lastError: errorDetails,
          timestamp,
          navigator: {
            onLine: navigator.onLine,
            userAgent: navigator.userAgent,
            language: navigator.language
          },
          runtime: {
            lastError: chrome.runtime.lastError
          }
        }
      }, resolve);
    });
    
    return true;
  } catch (e) {
    // Last resort console output if error tracking itself fails
    console.error('Error tracking system failure:', e);
    return false;
  }
}
