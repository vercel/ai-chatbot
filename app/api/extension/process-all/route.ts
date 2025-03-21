import { NextResponse } from 'next/server';
import { processStoredFiles } from '@/lib/extension/processing';

/**
 * Process all unprocessed files from the extension
 */
export async function POST() {
  try {
    // Make sure directories exist first
    const { ensureDirectories } = await import('@/lib/extension/processing');
    ensureDirectories();
    
    // Process all unprocessed files
    const result = await processStoredFiles();
    
    console.log(`Extension processing completed: ${result.processed} processed, ${result.failed} failed`);
    
    if (result.failed === 0) {
      return NextResponse.json({
        success: true,
        message: `Processed ${result.processed} files successfully`,
        processed: result.processed
      });
    } else {
      return NextResponse.json({
        success: result.processed > 0,  // Success if at least some files processed
        message: `Processed ${result.processed} files, but failed to process ${result.failed} files`,
        processed: result.processed,
        failed: result.failed
      }, result.processed > 0 ? { status: 200 } : { status: 500 });
    }
  } catch (error) {
    console.error('Error processing files:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process files',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}