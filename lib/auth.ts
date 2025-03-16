// Re-export auth functions from app/(auth)/auth.ts
import { auth } from '@/app/(auth)/auth';

export { auth };

// Create a getSession function that uses auth()
export async function getSession() {
  return await auth();
}

// Provide authOptions for backward compatibility
export const authOptions = {};