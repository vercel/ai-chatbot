import { processOfflineTempFiles } from './offline-processing';

let processingInterval: NodeJS.Timeout | null = null;
const CHECK_INTERVAL = 60 * 1000; // 60 seconds

/**
 * Start the background processor that checks the offline temp directory
 * every 60 seconds and processes any files found
 */
export function startBackgroundProcessor() {
  // Clear any existing interval
  if (processingInterval) {
    clearInterval(processingInterval);
  }
  
  // Start a new interval
  processingInterval = setInterval(async () => {
    try {
      console.log('Background processor checking offline temp directory...');
      const result = await processOfflineTempFiles();
      
      if (result.processed > 0 || result.failed > 0) {
        console.log(`Background processor processed ${result.processed} files, ${result.failed} failed`);
      }
    } catch (error) {
      console.error('Error in background processor:', error);
    }
  }, CHECK_INTERVAL);
  
  console.log('Background processor started');
  return processingInterval;
}

/**
 * Stop the background processor
 */
export function stopBackgroundProcessor() {
  if (processingInterval) {
    clearInterval(processingInterval);
    processingInterval = null;
    console.log('Background processor stopped');
  }
}

// Get the status of the background processor
export function getBackgroundProcessorStatus() {
  return {
    running: processingInterval !== null,
    checkInterval: CHECK_INTERVAL
  };
}