import path from 'path';

/**
 * Utility to create user-specific paths for content storage
 */
export function getUserDataPaths(userId: string) {
  // Base storage path
  const STORAGE_ROOT = path.join(process.cwd(), 'storage');
  
  // User-specific root directory
  const userPath = path.join(STORAGE_ROOT, 'users', userId);
  
  // Return structured paths for different content types
  return {
    root: userPath,
    recordings: path.join(userPath, 'recordings'),
    texts: path.join(userPath, 'texts'),
    notes: path.join(userPath, 'notes'),
    knowledge: path.join(userPath, 'knowledge'),
    // Add any other paths as needed
  };
}
