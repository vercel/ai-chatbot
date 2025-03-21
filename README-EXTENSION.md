# Wizzo Chrome Extension Integration

## Overview

The Wizzo Chrome Extension provides a lightweight way to capture content (audio recordings, text, and notes) even when the main Wizzo platform is not running. All captured content is stored locally in the Chrome browser and will be automatically synchronized when the platform is running again.

## Features

- **Audio Recording**: Record audio for up to 5 minutes
- **Text Input**: Add text with title and content
- **Quick Notes**: Create notes for the knowledge base
- **Offline Storage**: All content is stored locally until the platform is available
- **Auto-Sync**: Automatically processes pending content when the platform is running

## Installation

### Development Mode

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" by toggling the switch in the top right corner
3. Click "Load unpacked" and select the `chrome-extension` folder
4. The extension should now appear in your Chrome toolbar

## Technical Integration

### File Structure

```
wizzo-vercel-code/
├── app/
│   ├── api/
│   │   ├── extension/          # API endpoints for extension integration
│   │   ├── notes/              # Process notes from extension
│   │   ├── recordings/         # Process recordings from extension
│   │   ├── texts/              # Process text files from extension
│   │   └── status/             # Check if platform is running
│   └── extension/              # Extension management UI page
├── chrome-extension/           # Chrome extension files
│   ├── manifest.json           # Extension manifest
│   ├── popup.html              # Popup interface
│   ├── popup.css               # Popup styles
│   ├── popup.js                # Popup logic
│   ├── background.js           # Background service worker
│   ├── recordingView.html      # Full-screen recording interface
│   ├── recordingView.js        # Recording logic
│   └── icons/                  # Extension icons
├── components/
│   └── extension/              # UI components for extension management
├── lib/
│   └── extension/              # Server-side extension processing logic
└── storage/                    # Storage directories for extension content
    ├── recordings/             # Audio recordings storage
    ├── texts/                  # Text files storage
    └── notes/                  # Notes storage
```

### Data Flow

1. User captures content using the Chrome extension
2. Content is stored in Chrome's local storage
3. Extension periodically checks if the Wizzo platform is running
4. When platform is detected, extension sends content to the appropriate API endpoints
5. Platform processes and integrates the content into the knowledge base
6. Extension marks items as processed when successfully handled

### API Endpoints

#### Status Check
- **Endpoint**: `/api/status`
- **Method**: GET
- **Purpose**: Allows the extension to check if the platform is running

#### Recording Processing
- **Endpoint**: `/api/recordings/process`
- **Method**: POST
- **Purpose**: Processes audio recordings from the extension

#### Text Processing
- **Endpoint**: `/api/texts/process`
- **Method**: POST
- **Purpose**: Processes text files from the extension

#### Note Processing
- **Endpoint**: `/api/notes/process`
- **Method**: POST
- **Purpose**: Processes notes from the extension

#### List Unprocessed Files
- **Endpoint**: `/api/extension/unprocessed`
- **Method**: GET
- **Purpose**: Lists all unprocessed files from the extension

#### Process All Files
- **Endpoint**: `/api/extension/process-all`
- **Method**: POST
- **Purpose**: Processes all unprocessed files from the extension

## Platform Integration

The extension is integrated into the Wizzo platform through:

1. **Extension Management Page**: Access at `/extension` to view and manage files from the extension
2. **Sidebar Navigation**: Link in the sidebar for quick access to the extension management page
3. **Server-Side Processing**: Files are automatically processed and added to the knowledge base

## Development Notes

### Adding New Features

When adding new features to the extension:

1. Create new UI components in the popup/recordingView as needed
2. Add storage handling in the Chrome extension
3. Create corresponding API endpoints in the platform
4. Update the server-side processing logic
5. Update the UI components for the platform

### Testing

To test the extension:

1. Load the extension in Chrome
2. Ensure the Wizzo platform is running locally
3. Capture content using the extension
4. Verify that the content appears on the extension management page
5. Process the content and check that it's properly integrated into the platform