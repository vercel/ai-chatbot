# Testing and Debugging the Wizzo Chrome Extension

This guide provides instructions for testing and debugging the Wizzo Chrome Extension during development.

## Installing the Extension for Testing

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" by toggling the switch in the top right corner
3. Click "Load unpacked" and select the `chrome-extension` folder
4. The extension should now appear in your Chrome toolbar

## Testing Workflow

### Basic Functionality Testing

1. **Platform Connection Test**
   - Start the Wizzo platform (`npm run dev` or equivalent)
   - Click the extension icon to open the popup
   - The status should show "Online" if the connection is successful

2. **Audio Recording Test**
   - Click the "Record" button in the popup
   - Speak into your microphone
   - Click "Stop" and enter a title
   - Check that the recording appears in the list
   - If the platform is online, it should be processed automatically

3. **Text Input Test**
   - Go to the "Text" tab
   - Enter a title and content
   - Click "Save"
   - Check that the text appears in the list
   - If the platform is online, it should be processed automatically

4. **Notes Test**
   - Go to the "Notes" tab
   - Enter some content
   - Click "Save"
   - Check that the note appears in the list
   - If the platform is online, it should be processed automatically

5. **Settings Test**
   - Click the gear icon to access settings
   - Change various settings and save
   - Verify that the changes take effect

### Offline Mode Testing

1. **Capturing Content While Offline**
   - Stop the Wizzo platform
   - Record audio, add text, and create notes
   - Verify that all content is saved locally (status should show "Pending")

2. **Auto-sync When Platform Comes Online**
   - With pending content in the extension
   - Start the Wizzo platform
   - Wait for the extension to detect the platform (or click "Check Now")
   - Verify that all pending content is processed

3. **Manual Sync Test**
   - With pending content and the platform running
   - Click "Sync Now" in the extension
   - Verify that all pending content is processed

## Debugging Tools

### Extension Console

To access logs and debug information:

1. Right-click on the extension icon
2. Select "Inspect popup"
3. Check the Console tab for logs and errors

### Background Script Console

To view background process logs:

1. Go to `chrome://extensions/`
2. Find the Wizzo extension
3. Click on "background page" under "Inspect views"
4. Check the Console tab

### Content Storage Inspection

To inspect the local storage:

1. Open the background or popup console
2. Run this command to view all stored data:
   ```javascript
   chrome.storage.local.get(null, function(data) { console.log(data); });
   ```

3. To view specific data:
   ```javascript
   chrome.storage.local.get(['pendingRecordings'], function(result) { console.log(result); });
   ```

## Common Issues and Solutions

### Microphone Access

If recording doesn't work:
1. Check that you've granted microphone permissions
2. Go to Chrome Settings > Privacy and Security > Site Settings > Microphone
3. Ensure the extension or site has permission

### Connection Issues

If the extension shows "Offline" when the platform is running:
1. Verify the platform URL in the extension settings
2. Check that the `/api/status` endpoint is functioning correctly
3. Look for CORS errors in the console (may need to add headers on the server)

### Processing Failures

If content isn't being processed:
1. Check the browser console for detailed error messages
2. Verify the API endpoints are working by testing them directly
3. Ensure the storage paths on the server exist and are writable

## Automated Testing (Future)

For future implementation:

- Unit tests for the extension using Jest
- End-to-end tests using Cypress or Playwright
- API endpoint tests to verify integration with the platform

## Performance Testing

To ensure good performance:

1. Test with large files to ensure proper handling
2. Monitor memory usage during extended recording sessions
3. Test sync with multiple pending items