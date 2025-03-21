import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { authenticateExtensionRequest } from '@/lib/extension/auth';
import { verifyExtensionToken } from '@/lib/extension/auth';

// Define the directory paths
const STORAGE_ROOT = path.join(process.cwd(), 'storage');
const OFFLINE_TEMP_DIR = path.join(STORAGE_ROOT, 'offline-temp-files');

/**
 * Save data from the Chrome extension to the offline temp directory
 */
export async function POST(request: NextRequest) {
  return authenticateExtensionRequest(request, async (userId, authRequest) => {
    try {
      // Parse the request body
      const data = await authRequest.clone().json();
      
      // Make sure the offline temp directory exists
      ensureOfflineTempDirectories();
      
      // Validate the data
      if (!data.id || !data.type) {
        return NextResponse.json({
          success: false,
          error: 'Invalid data: id and type are required'
        }, { status: 400 });
      }
      
      // Set the user ID from authentication
      data.userId = userId;
    
    let filePath;
    switch (data.type) {
      case 'recording':
        filePath = path.join(OFFLINE_TEMP_DIR, 'recordings', `${data.id}.json`);
        break;
      case 'text':
        filePath = path.join(OFFLINE_TEMP_DIR, 'texts', `${data.id}.json`);
        break;
      case 'note':
        filePath = path.join(OFFLINE_TEMP_DIR, 'notes', `${data.id}.json`);
        break;
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid file type: must be recording, text, or note'
        }, { status: 400 });
    }
    
    // Add timestamp if not present
    if (!data.timestamp) {
      data.timestamp = new Date().toISOString();
    }
    
    // Add metadata
    data.savedToOffline = true;
    data.offlineSaveTimestamp = new Date().toISOString();
    
    // Save the file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    
    console.log(`Saved ${data.type} to offline temp directory: ${filePath}`);
    
    return NextResponse.json({
      success: true,
      message: `Saved ${data.type} to offline temp directory`,
      path: filePath
    });
    } catch (error) {
      console.error('Error saving to offline temp directory:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to save to offline temp directory',
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }
  });
}

/**
 * Ensure all necessary directories exist
 */
function ensureOfflineTempDirectories() {
  // Main directories
  [
    STORAGE_ROOT,
    OFFLINE_TEMP_DIR,
    path.join(OFFLINE_TEMP_DIR, 'recordings'),
    path.join(OFFLINE_TEMP_DIR, 'texts'),
    path.join(OFFLINE_TEMP_DIR, 'notes')
  ].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}