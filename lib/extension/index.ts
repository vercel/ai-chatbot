/**
 * Extension library exports
 */

// Re-export all functions from the extension processing module
export * from './processing';

// Export functions to process specific content types
export async function processText(data: any) {
  // Process text content from the extension
  console.log('Processing text:', data.title || 'Unnamed Text');
  
  // Mark as processed
  return {
    ...data,
    processed: true,
    processingTimestamp: new Date().toISOString()
  };
}

export async function processNote(data: any) {
  // Process note content from the extension
  console.log('Processing note:', data.id);
  
  // Mark as processed
  return {
    ...data,
    processed: true,
    processingTimestamp: new Date().toISOString()
  };
}

// Re-export offline processing functions
export * from './offline-processing';
