// Secure storage implementation

// Secure storage utility
export function secureStore() {
  return {
    // Store data securely
    async set(key, value) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: value }, () => {
          if (chrome.runtime.lastError) {
            console.error('Storage error:', chrome.runtime.lastError);
            resolve(false);
          } else {
            resolve(true);
          }
        });
      });
    },
    
    // Retrieve data
    async get(key) {
      return new Promise((resolve) => {
        chrome.storage.local.get([key], (result) => {
          if (chrome.runtime.lastError) {
            console.error('Storage error:', chrome.runtime.lastError);
            resolve(null);
          } else {
            resolve(result[key]);
          }
        });
      });
    },
    
    // Remove data
    async remove(key) {
      return new Promise((resolve) => {
        chrome.storage.local.remove(key, () => {
          if (chrome.runtime.lastError) {
            console.error('Storage error:', chrome.runtime.lastError);
            resolve(false);
          } else {
            resolve(true);
          }
        });
      });
    }
  };
}
