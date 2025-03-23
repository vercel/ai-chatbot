# Wizzo Chrome Extension with Side Panel

This Chrome extension integrates with the Wizzo platform, providing users with a seamless way to create and manage widgets, record audio, and take notes directly from their browser using a persistent side panel interface.

## Features

- **Persistent Side Panel**: Access Wizzo functionality from any tab with the always-available side panel
- **Authentication**: Uses the same authentication system as the Wizzo platform
- **Widget Management**: Create, view, and sync widgets with the platform
- **Audio Recording**: Record, save, and process voice recordings
- **Notes**: Create and manage notes that sync with your Wizzo account
- **Offline Support**: Work even when offline, with automatic sync when back online
- **Cross-tab Access**: Access your data while browsing any website

## Technical Implementation

The extension follows a modular architecture with the following main components:

1. **Side Panel Interface**: Persistent UI accessible across all browser tabs
2. **Authentication Module**: Securely manages user authentication with token-based security
3. **Data Synchronization Service**: Handles reliable data syncing between extension and platform
4. **Background Services**: Manages core functionality independent of the UI

## Directory Structure

```
chrome-extension/
├── background/             # Background services
│   ├── auth.js             # Authentication system
│   ├── sync.js             # Data synchronization
│   ├── storage.js          # Secure storage utilities
│   ├── messaging.js        # Message handling
│   └── errorTracking.js    # Error logging and reporting
├── sidepanel/              # Side panel interface
│   ├── index.html          # Main side panel HTML
│   ├── sidepanel.js        # Side panel controller
│   ├── styles.css          # Side panel styles
│   └── components/         # Modular UI components
│       ├── auth.js         # Authentication component
│       ├── recording.js    # Recording functionality
│       ├── notes.js        # Notes functionality
│       └── sync-status.js  # Sync status indicators
├── popup/                  # Legacy popup (for backward compatibility)
├── icons/                  # Extension icons
├── settings.html           # Settings page
├── background.js           # Main background script (entry point)
├── recordingView.html      # Full-page recording view
└── manifest.json           # Extension manifest (v3)
```

## Side Panel Architecture

The side panel architecture offers several advantages over the traditional popup approach:

- **Persistence**: Remains open while browsing, unlike popups which close when clicking outside
- **Enhanced UX**: Provides a more integrated and accessible user experience
- **Context Awareness**: Can adapt to the current tab's content
- **Improved Workflow**: Users can interact with Wizzo while viewing webpage content

### Key Components:

1. **Side Panel Controller (`sidepanel.js`)**: 
   - Manages the overall side panel functionality
   - Coordinates between different components
   - Handles UI state and transitions

2. **Authentication Component (`components/auth.js`)**: 
   - Manages login/logout flows
   - Maintains auth state across browser sessions
   - Handles token refresh and validation

3. **Recording Component (`components/recording.js`)**: 
   - Manages audio recording capability
   - Provides visualization and controls
   - Handles storage of recordings

4. **Notes Component (`components/notes.js`)**: 
   - Manages note creation and viewing
   - Handles storage and retrieval of notes

5. **Sync Status Component (`components/sync-status.js`)**: 
   - Displays synchronization status
   - Manages connection status indicators
   - Provides manual sync capability

## Security Considerations

- Authentication tokens are securely stored using Chrome's storage API
- All communication with the server is encrypted
- Automatic token refresh mechanism prevents session expiration
- The extension follows the principle of least privilege
- Side panel isolation provides additional security boundaries

## Development

To set up the development environment:

1. Clone the repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `chrome-extension` folder
5. Make your changes and reload the extension to test

### Testing the Side Panel

1. Click the extension icon in the toolbar to open the side panel
2. The side panel should open from the right side of the browser
3. Navigate between different websites to verify the side panel remains accessible
4. Test all functionality as outlined in the TESTING.md document

## Integration with Wizzo Platform

The extension is designed to work seamlessly with the Wizzo platform. It:

- Uses the same authentication module
- Maintains consistent data models
- Implements conflict resolution for syncing
- Provides clear feedback on sync status

## License

See the LICENSE file for details.
