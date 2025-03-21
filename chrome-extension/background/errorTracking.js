// Error tracking and reporting

const ERROR_LOG_KEY = 'wizzo_error_log';
const MAX_ERRORS = 50;

// Track an error
export async function trackError(context, error) {
  try {
    // Log to console
    console.error(`[${context}] Error:`, error);
    
    // Get current error log
    const errorLog = await getErrorLog();
    
    // Add new error
    errorLog.push({
      context,
      message: error.message || String(error),
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Keep only the most recent errors
    const trimmedLog = errorLog.slice(-MAX_ERRORS);
    
    // Save updated log
    await saveErrorLog(trimmedLog);
    
    // Could also send to remote error tracking service here
  } catch (loggingError) {
    // Fallback to console if error logging fails
    console.error('Error logging failed:', loggingError);
    console.error('Original error:', error);
  }
}

// Get the error log
async function getErrorLog() {
  return new Promise((resolve) => {
    chrome.storage.local.get([ERROR_LOG_KEY], (result) => {
      resolve(result[ERROR_LOG_KEY] || []);
    });
  });
}

// Save the error log
async function saveErrorLog(log) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [ERROR_LOG_KEY]: log }, resolve);
  });
}

// Get the error log for display
export async function getErrorLogForDisplay() {
  return await getErrorLog();
}

// Clear the error log
export async function clearErrorLog() {
  return await saveErrorLog([]);
}
