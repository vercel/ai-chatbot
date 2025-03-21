import { NextResponse } from 'next/server';
import { processOfflineTempFiles } from '@/lib/extension/offline-processing';

/**
 * Process all files from the offline temp directory
 */
export async function POST() {
  try {
    // Make sure directories exist
    const { ensureOfflineDirectories } = await import('@/lib/extension/offline-processing');
    ensureOfflineDirectories();
    
    // Process all offline temp files
    const result = await processOfflineTempFiles();
    
    console.log(`Offline processing completed: ${result.processed} processed, ${result.failed} failed`);
    
    return NextResponse.json({
      success: true,
      message: `Processed ${result.processed} files, ${result.failed} failed`,
      processed: result.processed,
      failed: result.failed,
      errors: result.errors
    });
  } catch (error) {
    console.error('Error processing offline files:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process offline files',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}