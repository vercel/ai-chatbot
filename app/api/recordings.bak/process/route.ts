import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';
import { authenticateExtensionRequest } from '@/lib/extension/auth';

// Define the storage directory paths
const RECORDINGS_DIR = path.join(process.cwd(), 'storage', 'recordings');

// Make sure the directories exist
if (!fs.existsSync(RECORDINGS_DIR)) {
  fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
  console.log(`Created recordings directory: ${RECORDINGS_DIR}`);
}

/**
 * Process audio recordings from the Chrome extension
 */
export async function POST(request: NextRequest) {
  // Use the authentication middleware
  return authenticateExtensionRequest(request, async (userId, authRequest) => {
    try {
      // Parse the request body
      const body = await authRequest.json();
      
      // Extract the recording data
      const { id, title, audio, timestamp } = body;
      
      if (!audio) {
        return NextResponse.json({ success: false, error: 'Audio data is required' }, { status: 400 });
      }
      
      // Create logging to debug the issue
      console.log(`Processing recording for user ${userId}: ${title}, ID: ${id}, Length: ${audio.length}`);
      
    try {
      // Try to decode base64 data
      const base64Data = audio.replace(/^data:audio\/\w+;base64,/, '');
      try {
        const buffer = Buffer.from(base64Data, 'base64');

        // Create a unique filename
        const sanitizedTitle = (title || 'recording').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = `${sanitizedTitle}_${nanoid()}.webm`;
        const filePath = path.join(RECORDINGS_DIR, filename);
        
        // Write the audio file to disk
        fs.writeFileSync(filePath, buffer);
        console.log(`Saved recording file to: ${filePath}`);
        
        // Create metadata file
        const metadataFilename = `${path.basename(filename, '.webm')}.json`;
        const metadataPath = path.join(RECORDINGS_DIR, metadataFilename);
        
        const metadata = {
          id,
          title: title || 'Untitled Recording',
          timestamp,
          filename,
          processed: true,
          source: 'chrome_extension'
        };
        
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
        console.log(`Saved metadata file to: ${metadataPath}`);
        
        // Return success response
        return NextResponse.json({ 
          success: true, 
          message: 'Recording processed successfully',
          data: {
            id,
            filename
          }
        }, { status: 200 });
      } catch (decodeError) {
        console.error('Failed to decode base64 data:', decodeError);
        return NextResponse.json({ 
          success: false, 
          error: `Failed to decode base64 data: ${decodeError instanceof Error ? decodeError.message : String(decodeError)}`
        }, { status: 400 });
      }
    } catch (error) {
      console.error('Error processing recording:', error);
      return NextResponse.json({ 
        success: false, 
        error: `Failed to process recording: ${error instanceof Error ? error.message : String(error)}`
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error processing recording request:', error);
    return NextResponse.json({ 
      success: false, 
      error: `Failed to process recording request: ${error instanceof Error ? error.message : String(error)}`
    }, { status: 500 });
  }
}