import { NextResponse } from 'next/server';

// Import the background processor
let backgroundProcessorStarted = false;

/**
 * Start the background processor when the server starts
 */
async function ensureBackgroundProcessor() {
  if (!backgroundProcessorStarted) {
    try {
      const { startBackgroundProcessor } = await import('@/lib/extension/background-processor');
      startBackgroundProcessor();
      backgroundProcessorStarted = true;
      console.log('Background processor started on server initialization');
    } catch (error) {
      console.error('Failed to start background processor:', error);
    }
  }
}

/**
 * Simple status endpoint to check if the Wizzo platform is running
 * Also ensures the background processor is running
 */
export async function GET() {
  // Start the background processor if not already started
  await ensureBackgroundProcessor();
  
  // Get the status of the background processor
  let processorStatus = { running: false };
  try {
    const { getBackgroundProcessorStatus } = await import('@/lib/extension/background-processor');
    processorStatus = getBackgroundProcessorStatus();
  } catch (error) {
    console.error('Failed to get background processor status:', error);
  }
  
  return NextResponse.json({ 
    status: 'online',
    backgroundProcessor: processorStatus
  }, { status: 200 });
}