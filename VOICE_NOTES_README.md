# Voice Notes Feature for Knowledge Base

This document describes the voice notes enhancement for the knowledge base.

## Overview

The voice notes feature allows users to add audio content to the knowledge base through two methods:
1. Recording audio directly in the browser
2. Uploading audio files from the user's device

The audio is processed using OpenAI's Whisper API for high-quality transcription and basic speaker diarization, then embedded into the knowledge base for use in chat interactions.

## Features

- **Recording Voice Notes**: Record audio directly from the browser
- **Uploading Audio Files**: Upload audio files from your device
- **Transcription Processing**: Real-time status updates for transcription progress
- **Speaker Diarization**: Identification of different speakers in the transcript
- **Transcript Visualization**: Display transcripts with timestamps and speaker information
- **Knowledge Integration**: Transcripts are embedded into the knowledge base for AI reference

## Setup Instructions

### 1. Install Required Dependencies

The following dependencies were added to the project:
- `@radix-ui/react-progress`: For the transcription progress indicator
- `@radix-ui/react-tabs`: For the tabbed interface in the upload modal

Install these dependencies:

```bash
npm install @radix-ui/react-progress @radix-ui/react-tabs
# or
yarn add @radix-ui/react-progress @radix-ui/react-tabs
```

### 2. Environment Configuration

Ensure your OpenAI API key is set in your environment variables:

```
OPENAI_API_KEY=your_openai_api_key
```

### 3. Storage Configuration

Voice notes and transcripts are stored in the following directories:
- `/storage/audio`: Audio files
- `/storage/transcripts`: Transcript JSON files

Make sure these directories exist and are writable.

### 4. Database

The existing knowledge base schema is used with no changes needed. Audio content uses the "audio" sourceType value in the KnowledgeDocument table.

## Usage

1. **Adding Voice Notes**:
   - Navigate to the Knowledge Base page
   - Click "Add Document"
   - Choose the "Record Voice" or "Upload Audio" tab
   - Record or upload your audio file
   - Add a title and optional description
   - Click "Add Document"

2. **Viewing Voice Notes**:
   - Go to the Knowledge Base page to see all your documents
   - Click "View Details" on any audio document
   - On the details page, you can:
     - Play the original audio
     - View the transcript with speaker information
     - See the extracted knowledge chunks

3. **Using in Chat**:
   - Voice notes content is automatically available in chat
   - The AI can reference and cite information from your voice notes

## Technical Implementation

The implementation includes:
- Browser-based audio recording using the MediaRecorder API
- File handling for audio uploads and storage
- OpenAI Whisper API integration for transcription
- Transcript processing and chunking
- Real-time progress tracking
- UI components for recording, playback, and transcript visualization

## Limitations

- Basic speaker diarization (simulated in this version)
- Limited audio format support (primarily WebM, MP3, WAV, OGG)
- File size limit of 25MB (default, configurable)
- 5-minute recording limit (default, configurable)

## Future Improvements

- Advanced speaker diarization with proper speaker identification
- More sophisticated audio processing options
- Support for longer recordings
- Additional audio formats
- Audio summarization features
