# Wizzo Chrome Extension

This Chrome extension integrates with the Wizzo platform, providing users with a seamless way to create and manage widgets, record audio, and take notes directly from their browser.

## Features

- **Authentication**: Uses the same authentication system as the Wizzo platform
- **Widget Management**: Create, view, and sync widgets with the platform
- **Audio Recording**: Record, save, and process voice recordings
- **Notes**: Create and manage notes that sync with your Wizzo account
- **Offline Support**: Work even when offline, with automatic sync when back online

## Technical Implementation

The extension follows a modular architecture with three main components:

1. **Authentication Module**: Securely manages user authentication with token-based security
2. **Data Synchronization Service**: Handles reliable data syncing between extension and platform
3. **User Interface**: Provides a clean, intuitive interface for all functionality

## Directory Structure

```
chrome-extension/
├── background/             # Background services
│   ├── background.js       # Main background script (entry point)
│   ├── auth.js             # Authentication system
│   ├── sync.js             # Data synchronization
│   ├── storage.js          # Secure storage utilities
│   ├── messaging.js        # Message handling
│   └── errorTracking.js    # Error logging and reporting
├── popup/                  # User interface
│   ├── index.html          # Main popup HTML
│   ├── popup.js            # Popup controller
│   └── styles.css          # Popup styles
├── icons/                  # Extension icons
├── settings.html           # Settings page
├── settings.js             # Settings controller
├── recordingView.html      # Full-page recording view
├── recordingView.js        # Recording controller
└── manifest.json           # Extension manifest
```

## Security Considerations

- Authentication tokens are securely stored using Chrome's storage API
- All communication with the server is encrypted
- Automatic token refresh mechanism prevents session expiration
- The extension follows the principle of least privilege

## Development

To set up the development environment:

1. Clone the repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `chrome-extension` folder
5. Make your changes and reload the extension to test

## Integration with Wizzo Platform

The extension is designed to work seamlessly with the Wizzo platform. It:

- Uses the same authentication module
- Maintains consistent data models
- Implements conflict resolution for syncing
- Provides clear feedback on sync status

## License

See the LICENSE file for details.
