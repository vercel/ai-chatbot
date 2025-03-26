# Wizzo Chrome Extension - Knowledge Synchronization

This document explains how the knowledge synchronization system works in the Wizzo Chrome extension.

## Overview

The knowledge synchronization system allows users to create and manage content (recordings, notes, etc.) in the Chrome extension and have it automatically synchronized with their Wizzo account on the backend platform. This ensures a seamless experience between the extension and the main Wizzo platform.

## Key Components

### 1. Extension Background Services

- **knowledgeSync.js**: Manages the knowledge synchronization process, tracking sync status, and communicating with the backend.
- **auth.js**: Handles authentication to ensure syncing is done securely with the user's account.
- **background.js**: Initializes the knowledge sync service and sets up periodic sync tasks.

### 2. API Endpoints

- **/api/extension/knowledge/sync-recordings**: Processes and syncs audio recordings from the extension to the user's knowledge base.
- **/api/extension/knowledge/sync-notes**: Processes and syncs text notes from the extension to the user's knowledge base.
- **/api/extension/knowledge/get-updates**: Returns the user's knowledge base updates since the last sync.

### 3. User Interface

- **Knowledge Tab**: Shows knowledge statistics, pending sync items, and recently synchronized items.
- **Sync Button**: Allows manual synchronization of knowledge items.
- **Sync Status Indicator**: Shows whether knowledge is fully synced or has pending changes.

## How Synchronization Works

1. **Authentication**: The system first authenticates the user to ensure secure synchronization.

2. **Local Storage**: 
   - Recordings and notes are stored locally in chrome.storage.local
   - Each item has a 'synced' property to track its sync status

3. **Periodic Sync**:
   - The system syncs knowledge data every 10 minutes automatically
   - Manual sync can be triggered from the UI
   - Sync happens in both directions:
     - Local to backend: Pushes recordings and notes that haven't been synced
     - Backend to local: Fetches knowledge updates from the platform

4. **Conflict Resolution**:
   - Newer items always take precedence over older ones
   - Server-side processing is done asynchronously
   - The system tracks which items have been synced successfully

## Development Notes

### Adding New Knowledge Types

To add a new type of knowledge item to the sync system:

1. Create a new API endpoint for the specific type (e.g., `/api/extension/knowledge/sync-images`)
2. Update `knowledgeSync.js` to include the new item type in the sync process
3. Add UI elements for the new item type in the popup interface

### Debugging Sync Issues

Common sync issues can be traced using:

1. Extension background logs (view in Developer Tools of extension's background page)
2. The `wizzo_knowledge_sync_status` object in chrome.storage.local
3. Server-side logs for the knowledge sync endpoints

## Maintaining Sync Consistency

To ensure consistent synchronization:

1. Always check authentication status before syncing
2. Track sync status of each item with timestamps
3. Implement retries for failed sync attempts
4. Use batch processing for efficiency
5. Notify users about sync status (success, pending, or errors)
