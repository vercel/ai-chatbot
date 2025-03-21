# Wizzo Assistant Chrome Extension

This Chrome extension allows you to capture audio recordings, text notes, and other content even when the main Wizzo platform is not running. When the platform comes back online, the extension will automatically synchronize all pending content.

## Features

- **Audio Recording**: Record audio up to 5 minutes with visualizations
- **Text Input**: Add text content for processing
- **Quick Notes**: Create notes that will be added to your knowledge base
- **Offline Mode**: All content is saved locally until the platform is available
- **Auto-Sync**: Automatically processes pending content when the platform is running

## Installation

### Development Mode

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" by toggling the switch in the top right corner
3. Click "Load unpacked" and select the `chrome-extension` folder
4. The extension should now appear in your Chrome toolbar

### Production Mode (Future)

- The extension will be available on the Chrome Web Store (coming soon)

## Usage

### Recording Audio

1. Click on the Wizzo Assistant icon in your Chrome toolbar
2. Go to the "Recording" tab
3. Click "Record" to start recording audio
4. You can "Pause" and "Resume" as needed
5. Click "Stop" when finished
6. Add a title and the recording will be saved locally
7. When the Wizzo platform is running again, your recording will be processed automatically

### Adding Text

1. Click on the Wizzo Assistant icon in your Chrome toolbar
2. Go to the "Text" tab
3. Enter a title and content
4. Click "Save" to store the text locally
5. When the Wizzo platform is running again, your text will be processed automatically

### Creating Notes

1. Click on the Wizzo Assistant icon in your Chrome toolbar
2. Go to the "Notes" tab
3. Enter your note content
4. Click "Save" to store the note locally
5. When the Wizzo platform is running again, your note will be added to the knowledge base

## Full Screen Recording

For a better recording experience, you can use the full screen recording view:

1. Click on the extension icon
2. Go to the "Recording" tab
3. Click the "Open in new tab" button (or right-click on "Record" and select "Open in new tab")
4. This will open a dedicated recording page with waveform visualization and controls

## System Architecture

### Storage

The extension uses Chrome's local storage API to store pending items. This includes:
- Audio recordings (stored as base64-encoded strings)
- Text documents
- Notes

All items are stored with metadata including:
- Unique ID
- Timestamp
- Title (when applicable)
- Processing status

### Background Processes

The extension uses a background service worker to:
1. Periodically check if the Wizzo platform is running
2. Automatically process any pending items when the platform comes back online
3. Retry failed processing attempts with an exponential backoff strategy

### Platform Integration

The extension connects to the Wizzo platform using these endpoints:

- `/api/status` - Checks if the platform is running
- `/api/recordings/process` - Processes pending recordings
- `/api/texts/process` - Processes pending text files
- `/api/notes/process` - Processes pending notes

## Development

The extension is built using standard web technologies:

- JavaScript for functionality
- HTML/CSS for the user interface
- Chrome Extension APIs for browser integration

### File Structure

```
chrome-extension/
├── manifest.json        # Extension manifest
├── popup.html           # Main popup interface
├── popup.css            # Popup styles
├── popup.js             # Popup logic
├── background.js        # Background service worker
├── recordingView.html   # Full-screen recording interface
├── recordingView.js     # Recording interface logic
└── icons/               # Extension icons
```

### Building & Testing

1. Make changes to the source files
2. Load the extension in Chrome using "Load unpacked"
3. To see console logs and debug, right-click the extension icon and select "Inspect popup"
4. For background script logs, go to `chrome://extensions`, find the extension, and click "background page" under "Inspect views"

## Privacy and Security

- All data is stored locally in your browser until it's processed by the Wizzo platform
- No data is sent to any third-party servers
- Audio recordings and other content are only transmitted to your own Wizzo platform instance
- The extension requires minimal permissions and only accesses necessary APIs