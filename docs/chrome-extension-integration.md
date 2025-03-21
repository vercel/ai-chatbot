# Chrome Extension Integration Guide

This guide explains how the Wizzo Chrome Extension integrates with the main platform, enabling offline content capture and processing.

## Overview

The Chrome Extension serves as a lightweight input mechanism for the Wizzo platform, allowing you to:

1. Record audio even when the main platform is not running
2. Add text files for later processing
3. Create quick notes for your knowledge base

All content is stored locally in the browser until the main platform is running, at which point it's automatically processed.

## How It Works

### Architecture

```
┌─────────────────┐      ┌─────────────────┐     ┌─────────────────┐
│                 │      │                 │     │                 │
│  Chrome         │      │  Wizzo          │     │  Storage        │
│  Extension      │──────▶  API            │─────▶  Directories    │
│                 │      │  Endpoints      │     │                 │
└─────────────────┘      └─────────────────┘     └─────────────────┘
        │                                               │
        │                                               │
        │           ┌─────────────────┐                 │
        │           │                 │                 │
        └──────────▶│  Processing     │◀────────────────┘
                    │  Pipeline       │
                    │                 │
                    └─────────────────┘
```

### Components

1. **Chrome Extension**: Captures and locally stores recordings, texts, and notes
2. **API Endpoints**: Receive content from the extension and initiate processing
3. **Storage Directories**: Stores uploaded content (recordings, texts, notes)
4. **Processing Pipeline**: Handles content ingestion, analysis, and knowledge integration

### Data Flow

1. User records audio or adds text/notes via the extension
2. Content is stored in Chrome's local storage
3. Extension periodically checks if the Wizzo platform is running
4. When the platform is detected, extension sends pending content to the appropriate API endpoints
5. Platform processes the content and stores it in the knowledge base
6. Extension marks items as processed once successfully handled

## API Endpoints

### Status Check
- **Endpoint**: `/api/status`
- **Method**: GET
- **Purpose**: Allows the extension to check if the platform is running

### Recording Processing
- **Endpoint**: `/api/recordings/process`
- **Method**: POST
- **Purpose**: Processes audio recordings from the extension

### Text Processing
- **Endpoint**: `/api/texts/process`
- **Method**: POST
- **Purpose**: Processes text files from the extension

### Note Processing
- **Endpoint**: `/api/notes/process`
- **Method**: POST
- **Purpose**: Processes notes from the extension

## Storage Structure

Content from the extension is stored in the following directories:

```
storage/
├── recordings/   # Audio recordings
├── texts/        # Text files
└── notes/        # Quick notes
```

Each directory contains:
- The content files themselves
- Metadata JSON files with additional information

## Integration Mechanisms

### Automatic Detection

The extension automatically checks for the platform's availability every minute. When it detects that the platform is running, it will:

1. Gather all unprocessed content
2. Send it to the appropriate API endpoints
3. Track the processing status
4. Retry failed items with exponential backoff

### Manual Synchronization

Users can also manually trigger synchronization from the extension by:

1. Clicking on the extension icon
2. Going to the footer section
3. Clicking the "Sync Now" button (visible when platform is online)

### Platform Management

The platform includes a component to view and manage extension content:

1. Displays unprocessed files from the extension
2. Allows manual processing of pending items
3. Shows processing status and history

## Troubleshooting

### Extension Shows "Offline" Status

1. Ensure the Wizzo platform is running
2. Check that it's accessible at `http://localhost:3000`
3. Verify the API endpoints are functioning properly

### Content Not Being Processed

1. Check the browser console for error messages
2. Ensure the storage directories exist and are writable
3. Verify that the processing functions are working correctly

### Processing Errors

1. Examine the server logs for detailed error information
2. Check that the content format matches what the platform expects
3. Ensure the platform has sufficient resources to process the content

## Future Enhancements

Planned improvements to the extension integration:

1. End-to-end encryption for content transfer
2. More robust offline capabilities with progressive enhancement
3. Advanced content processing options (transcription, summarization, etc.)
4. Real-time sync status updates via WebSockets
5. Support for additional content types and formats