# Wizzo Extension Side Panel - Testing Guide

This document outlines the testing procedures for the Wizzo Chrome extension side panel implementation. Follow these steps to verify that all functionality is working correctly.

## Prerequisites

- Chrome browser (version 88 or higher)
- Developer mode enabled in Chrome extensions
- Access to a test Wizzo platform account

## Installation for Testing

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" using the toggle in the top-right corner
3. Click "Load unpacked" and select the `chrome-extension` directory
4. Verify that the Wizzo extension appears with its icon in the extensions list
5. Make sure the extension is pinned to the toolbar for easy access

## Test Cases

### 1. Basic Side Panel Functionality

| Test | Steps | Expected Result |
|------|-------|-----------------|
| 1.1 | Click the Wizzo extension icon in the toolbar | Side panel opens from the right side of the browser |
| 1.2 | Navigate to different websites in different tabs | Side panel remains accessible and functional across all tabs |
| 1.3 | Close and reopen the browser | Side panel settings and authentication state persist |

### 2. Authentication Flow

| Test | Steps | Expected Result |
|------|-------|-----------------|
| 2.1 | Open the side panel without being logged in | Login form is displayed |
| 2.2 | Enter invalid credentials and click "Sign In" | Error message displayed, user remains on login form |
| 2.3 | Enter valid credentials and click "Sign In" | Login successful, main interface displayed |
| 2.4 | Click "Sign Out" | User logged out, login form displayed |
| 2.5 | Close side panel, reopen in a different tab | Authentication state persists (logged in or out) |
| 2.6 | Click "Sign up" | Opens Wizzo platform signup page in a new tab |

### 3. Recording Functionality

| Test | Steps | Expected Result |
|------|-------|-----------------|
| 3.1 | Go to "Recordings" tab and click "Record" | Permission prompt appears if not previously granted |
| 3.2 | Grant microphone permission and start recording | Recording begins, timer starts, waveform visualizes audio (if enabled) |
| 3.3 | Click "Pause" during recording | Recording pauses, timer stops |
| 3.4 | Click "Resume" | Recording continues, timer resumes |
| 3.5 | Click "Stop" | Recording ends, data saved locally |
| 3.6 | Enter a title and click "Stop" | Recording saved with the provided title |
| 3.7 | View saved recordings list | Recording appears in the list with correct title |
| 3.8 | Click "Play" on a recording | Audio playback begins |
| 3.9 | Click "Delete" on a recording | Confirmation prompt appears, recording removed when confirmed |
| 3.10 | Start recording and leave it for max time limit | Recording stops automatically after reaching time limit |

### 4. Notes Functionality

| Test | Steps | Expected Result |
|------|-------|-----------------|
| 4.1 | Go to "Notes" tab and enter text | Text appears in the note input field |
| 4.2 | Click "Save" with empty content | Error message displayed |
| 4.3 | Enter content and click "Save" | Note saved and appears in the list |
| 4.4 | Click "View" on a note | Modal opens showing full note content |
| 4.5 | Click "Delete" on a note | Confirmation prompt appears, note removed when confirmed |
| 4.6 | Create multiple notes | All notes appear in the list in correct order |

### 5. Widget Management

| Test | Steps | Expected Result |
|------|-------|-----------------|
| 5.1 | Go to "Widgets" tab | List of existing widgets displayed or empty state shown |
| 5.2 | Click "Create New Widget" | Widget form displayed |
| 5.3 | Submit widget form without title | Error message displayed |
| 5.4 | Fill form and click "Save Widget" | Widget created, appears in list |
| 5.5 | Click on a widget in the list | Opens the widget in the Wizzo platform in a new tab |
| 5.6 | Create widget while offline | Widget saved locally with "pending sync" status |

### 6. Synchronization

| Test | Steps | Expected Result |
|------|-------|-----------------|
| 6.1 | Create content while online | Automatic sync attempt, "synced" status appears |
| 6.2 | Turn off internet connection | Connection status changes to "Offline" |
| 6.3 | Create content while offline | Content saved with "pending sync" status |
| 6.4 | Turn internet connection back on | Connection status changes to "Online" |
| 6.5 | Click sync button | Manual sync triggered, pending items synchronized |
| 6.6 | View Wizzo platform website | Created content appears on the platform |

### 7. Error Handling

| Test | Steps | Expected Result |
|------|-------|-----------------|
| 7.1 | Simulate network error during sync | Error handling, retry option provided |
| 7.2 | Interrupt a recording abruptly | Graceful handling, no crash |
| 7.3 | Try to create identical widgets | Proper error handling, no duplicates |
| 7.4 | Revoke microphone permission | Clear error message when trying to record |

### 8. Side Panel Specific Tests

| Test | Steps | Expected Result |
|------|-------|-----------------|
| 8.1 | Resize browser window | Side panel UI adjusts responsively |
| 8.2 | Open side panel on very small screen | UI elements remain usable, scrolling works |
| 8.3 | Switch between tabs quickly | UI state maintained, no rendering issues |
| 8.4 | Open side panel while on platform website | Optional: enhanced integration features activated |

## Reporting Issues

If you encounter any issues during testing, please document them with the following information:

1. Test case ID and description
2. Steps to reproduce
3. Expected result
4. Actual result
5. Browser version and OS
6. Screenshots (if applicable)
7. Console errors (if any)

Submit the issue report to the development team for investigation.

## Sign-off Checklist

- [ ] All test cases pass
- [ ] Authentication works reliably
- [ ] Recording functionality works in all scenarios
- [ ] Notes functionality works correctly
- [ ] Widget management functions properly
- [ ] Synchronization works reliably
- [ ] Error handling is robust
- [ ] UI is responsive and user-friendly
- [ ] Performance is acceptable
- [ ] No console errors during normal operation

Once all items are checked, the extension is ready for deployment.
