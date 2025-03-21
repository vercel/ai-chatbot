import { NextResponse } from 'next/server';
import { getUnprocessedFiles } from '@/lib/extension/processing';

/**
 * Get all unprocessed files from the extension
 */
export async function GET() {
  try {
    // Make sure directories exist first
    const { ensureDirectories } = await import('@/lib/extension/processing');
    ensureDirectories();
    
    // Get unprocessed files
    const unprocessed = getUnprocessedFiles();
    
    // Combine all files into a single array for the UI
    const allFiles = [
      ...unprocessed.recordings.map(file => ({ ...file })),
      ...unprocessed.texts.map(file => ({ ...file })),
      ...unprocessed.notes.map(file => ({ ...file }))
    ];
    
    // Sort by timestamp, newest first
    const sortedFiles = allFiles.sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
    
    return NextResponse.json({
      success: true,
      files: sortedFiles,
      counts: {
        recordings: unprocessed.recordings.length,
        texts: unprocessed.texts.length,
        notes: unprocessed.notes.length,
        total: allFiles.length
      }
    });
  } catch (error) {
    console.error('Error getting unprocessed files:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get unprocessed files',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}