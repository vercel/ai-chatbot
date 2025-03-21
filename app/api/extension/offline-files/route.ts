import { NextResponse } from 'next/server';
import { getOfflineFiles } from '@/lib/extension/offline-processing';

/**
 * Get all files from the offline temp directory
 */
export async function GET() {
  try {
    // Make sure directories exist
    const { ensureOfflineDirectories } = await import('@/lib/extension/offline-processing');
    ensureOfflineDirectories();
    
    // Get offline files
    const files = getOfflineFiles();
    
    return NextResponse.json({
      success: true,
      files: files.all,
      counts: {
        recordings: files.recordings.length,
        texts: files.texts.length,
        notes: files.notes.length,
        total: files.all.length
      }
    });
  } catch (error) {
    console.error('Error getting offline files:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get offline files',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}