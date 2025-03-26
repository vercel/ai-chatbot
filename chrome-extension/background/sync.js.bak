// Data synchronization service implementation

import { secureStore } from './storage.js';
import { checkAuthStatus, getAuthHeaders } from './auth.js';
import { trackError } from './errorTracking.js';

const WIDGET_DATA_KEY = 'wizzo_widget_data';
const SYNC_STATUS_KEY = 'wizzo_sync_status';

// Initialize the synchronization service
export async function initSyncService() {
  console.log('Initializing sync service...');
  
  // Listen for platform tabs being opened
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
      // Check if the URL is a Wizzo platform
      const settings = chrome.storage.local.get(['settings'], (result) => {
        const platformUrl = result.settings?.platformUrl || 'https://wizzo.com';
        
        if (tab.url.includes(platformUrl) || tab.url.includes('wizzo.com')) {
          console.log('Wizzo platform detected, triggering sync...');
          syncWidgetData();
        }
      });
    }
  });
  
  // Set initial sync status
  const syncStatus = await getSyncStatus();
  if (!syncStatus) {
    await setSyncStatus({
      lastSyncAttempt: null,
      lastSuccessfulSync: null,
      pendingChanges: 0,
      syncInProgress: false
    });
  }
  
  return true;
}

// Get the current sync status
export async function getSyncStatus() {
  return await secureStore().get(SYNC_STATUS_KEY);
}

// Update the sync status
export async function setSyncStatus(status) {
  await secureStore().set(SYNC_STATUS_KEY, status);
  return status;
}

// Update sync status with current data
export async function updateSyncStatus() {
  const widgets = await getWidgetData();
  const unsyncedWidgets = widgets.filter(w => !w.syncedAt || new Date(w.updatedAt) > new Date(w.syncedAt));
  
  const currentStatus = await getSyncStatus() || {};
  const newStatus = {
    ...currentStatus,
    pendingChanges: unsyncedWidgets.length,
    lastSyncAttempt: currentStatus.lastSyncAttempt
  };
  
  return setSyncStatus(newStatus);
}

// Get all widget data
export async function getWidgetData() {
  const data = await secureStore().get(WIDGET_DATA_KEY);
  return data || [];
}

// Save widget data
export async function saveWidgetData(widgets) {
  return await secureStore().set(WIDGET_DATA_KEY, widgets);
}

// Get unsynchronized widget data
export async function getUnsyncedWidgetData() {
  const widgets = await getWidgetData();
  return widgets.filter(w => !w.syncedAt || new Date(w.updatedAt) > new Date(w.syncedAt));
}

// Mark widgets as synchronized
export async function markWidgetsAsSynced(widgetIds) {
  const now = new Date().toISOString();
  const widgets = await getWidgetData();
  
  const updatedWidgets = widgets.map(widget => {
    if (widgetIds.includes(widget.id)) {
      return { ...widget, syncedAt: now };
    }
    return widget;
  });
  
  await saveWidgetData(updatedWidgets);
  await updateSyncStatus();
  
  return updatedWidgets;
}

// Add a new widget
export async function addWidget(widget) {
  const widgets = await getWidgetData();
  
  // Generate a unique ID if not provided
  if (!widget.id) {
    widget.id = Date.now().toString();
  }
  
  // Set creation and update timestamps
  const now = new Date().toISOString();
  widget.createdAt = now;
  widget.updatedAt = now;
  widget.syncedAt = null;
  
  // Add the widget
  widgets.push(widget);
  
  // Save widgets
  await saveWidgetData(widgets);
  
  // Update sync status
  await updateSyncStatus();
  
  return widget;
}

// Update an existing widget
export async function updateWidget(widgetId, updates) {
  const widgets = await getWidgetData();
  const index = widgets.findIndex(w => w.id === widgetId);
  
  if (index === -1) {
    throw new Error(`Widget with ID ${widgetId} not found`);
  }
  
  // Update the widget
  const now = new Date().toISOString();
  widgets[index] = {
    ...widgets[index],
    ...updates,
    updatedAt: now,
    syncedAt: null // Mark as not synced
  };
  
  // Save widgets
  await saveWidgetData(widgets);
  
  // Update sync status
  await updateSyncStatus();
  
  return widgets[index];
}

// Delete a widget
export async function deleteWidget(widgetId) {
  const widgets = await getWidgetData();
  const updatedWidgets = widgets.filter(w => w.id !== widgetId);
  
  // Save widgets
  await saveWidgetData(updatedWidgets);
  
  // Update sync status
  await updateSyncStatus();
  
  return true;
}

// Synchronize widget data with the server
export async function syncWidgetData() {
  try {
    // Check authentication status
    const authStatus = await checkAuthStatus();
    if (!authStatus.isAuthenticated) {
      console.warn('Cannot sync: User not authenticated');
      return { success: false, error: 'Not authenticated' };
    }
    
    // Get auth headers
    const headers = await getAuthHeaders();
    
    // Update sync status
    let syncStatus = await getSyncStatus() || {};
    syncStatus = await setSyncStatus({
      ...syncStatus,
      lastSyncAttempt: new Date().toISOString(),
      syncInProgress: true
    });
    
    // Get unsynchronized data
    const unsyncedWidgets = await getUnsyncedWidgetData();
    
    if (unsyncedWidgets.length === 0) {
      console.log('No data to synchronize');
      await setSyncStatus({
        ...syncStatus,
        syncInProgress: false
      });
      return { success: true, message: 'No data to sync' };
    }
    
    console.log(`Syncing ${unsyncedWidgets.length} widgets...`);
    
    // Call the API to sync data
    const response = await fetch(`${global.API_BASE_URL}/api/widgets/sync`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        userId: authStatus.userId,
        widgets: unsyncedWidgets,
        clientTimestamp: new Date().toISOString()
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Sync failed:', data.error);
      await setSyncStatus({
        ...syncStatus,
        syncInProgress: false
      });
      return { success: false, error: data.error || 'Synchronization failed' };
    }
    
    // Mark widgets as synced
    await markWidgetsAsSynced(unsyncedWidgets.map(w => w.id));
    
    // If server sends back updates, process them
    if (data.serverUpdates && Array.isArray(data.serverUpdates)) {
      await processServerUpdates(data.serverUpdates);
    }
    
    // Update sync status
    await setSyncStatus({
      lastSyncAttempt: new Date().toISOString(),
      lastSuccessfulSync: new Date().toISOString(),
      pendingChanges: 0,
      syncInProgress: false
    });
    
    console.log('Sync completed successfully');
    return { success: true, syncedCount: unsyncedWidgets.length };
  } catch (error) {
    trackError('syncWidgetData', error);
    
    // Update sync status
    const syncStatus = await getSyncStatus() || {};
    await setSyncStatus({
      ...syncStatus,
      syncInProgress: false
    });
    
    return { success: false, error: 'Sync failed. Will retry later.' };
  }
}

// Process updates from the server
async function processServerUpdates(updates) {
  console.log('Processing server updates:', updates.length);
  
  const widgets = await getWidgetData();
  let updated = false;
  
  // Process each update
  for (const update of updates) {
    const index = widgets.findIndex(w => w.id === update.id);
    
    if (index === -1) {
      // New widget from server
      widgets.push({
        ...update,
        syncedAt: new Date().toISOString()
      });
      updated = true;
    } else {
      // Compare timestamps to resolve conflicts
      const serverTime = new Date(update.updatedAt);
      const localTime = new Date(widgets[index].updatedAt);
      
      if (serverTime > localTime) {
        // Server has newer data
        widgets[index] = {
          ...update,
          syncedAt: new Date().toISOString()
        };
        updated = true;
      }
      // Otherwise keep local version
    }
  }
  
  // Save if widgets were updated
  if (updated) {
    await saveWidgetData(widgets);
  }
  
  return updated;
}

// Initialize global variables
global.syncWidgetData = syncWidgetData;
