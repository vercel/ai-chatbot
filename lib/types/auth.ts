import type { User as CivicUser } from '@civic/auth-web3';

// Ensure our user always has id and email
interface CustomUserFields {
  id: string;
  email: string;
}

// Extend the base Civic Auth User type with our required fields
export type User = CivicUser & CustomUserFields;

// Type guard to check if a user has our required fields
export function isValidUser(user: CivicUser | null): user is User {
  if (!user) return false;
  return typeof (user as User).id === 'string' && 
         typeof (user as User).email === 'string';
} 