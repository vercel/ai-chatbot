# Troubleshooting Guide for Voice Notes Feature

## Common Issues

### 1. Dependency Issues

The project uses React 19 RC (Release Candidate) which may have compatibility issues with some dependencies.

#### Problem: Module Not Found Errors

```
Module not found: Can't resolve '@radix-ui/react-tabs'
```

**Solution:**
We've refactored the code to eliminate dependencies on Radix UI Tabs and Progress components. The application now uses simpler, native components that are compatible with React 19 RC.

If you see these errors:
1. Make sure to run the latest code which doesn't use these dependencies
2. Run `npm install` without installing the problematic packages

#### Problem: Peer Dependency Conflicts

```
npm error code ERESOLVE
npm error ERESOLVE could not resolve
```

**Solution:**
You can use the `--legacy-peer-deps` flag to bypass peer dependency resolution:

```bash
npm install --legacy-peer-deps
```

### 2. Server-side Errors (500)

#### Problem: Server Error on Knowledge Pages

```
GET /knowledge 500 in 30ms
```

**Potential Causes:**
- Missing audio storage directories
- Database table issues
- API route errors

**Solution:**
1. Check server logs for specific error details
2. Make sure storage directories exist (storage/audio, storage/transcripts)
3. Verify that types match correctly in the database queries (id parameters)
4. Look for null handling of user IDs and audio file paths

### 3. Audio Recording Issues

#### Problem: Unable to Record Audio

**Solution:**
1. Check browser permissions for microphone access
2. Make sure you're using a secure context (https or localhost)
3. Try a different browser (Chrome/Edge generally have the best MediaRecorder support)

### 4. Transcription Issues

#### Problem: Transcription Fails or Times Out

**Solution:**
1. Verify your OpenAI API key is valid and has access to the Whisper API
2. Check that the audio file format is supported (MP3, WAV, WebM, etc.)
3. Ensure the file size is under API limits (typically 25MB)
4. Look for server timeouts if processing large files

### 5. Storage Issues

#### Problem: Error Saving Files

**Solution:**
1. Check that storage directories exist and have proper permissions:
   ```bash
   mkdir -p storage/audio storage/transcripts storage/embeddings
   chmod -R 755 storage
   ```
2. Verify the server has disk space available
3. Check for file path issues or invalid characters in filenames

## Debugging Tips

1. **Check Browser Console**: Many issues will appear in the browser's developer console

2. **API Testing**: Use tools like Postman to test API endpoints directly:
   - `/api/knowledge/audio` for audio file upload
   - `/api/knowledge/audio/record` for recorded audio
   - `/api/knowledge/[id]/transcription/progress` for monitoring progress

3. **Component Inspection**: Use React DevTools to examine component state and props

4. **TypeScript Errors**: Run type checking to identify type mismatches:
   ```bash
   npx tsc --noEmit
   ```

## Quick Fixes for Common TypeScript Errors

1. **Nullable User ID**: Use fallback empty strings
   ```typescript
   userId: session?.user?.id || ''
   ```

2. **Function Parameter Types**: Use object destructuring for id parameters
   ```typescript
   await getKnowledgeDocumentById({ id: documentId })
   ```

3. **Missing Properties**: Add to interface definitions
   ```typescript
   export interface WhisperTranscriptionProgressEvent {
     message?: string;
     transcript?: WhisperTranscriptionResponse;
     // ...
   }
   ```

## Feature Limitations

- Basic speaker diarization (simulated, not real AI-based diarization)
- Audio recording length limited to 5 minutes by default
- File size limit of 25MB
- Limited audio format support
