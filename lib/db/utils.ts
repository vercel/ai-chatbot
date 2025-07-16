import { generateId } from 'ai';

// Since we use WorkOS for authentication, we don't need real password hashing
// These functions generate placeholder passwords for database compatibility
export function generateHashedPassword(password: string) {
  // Generate a consistent placeholder based on input
  return `workos-placeholder-${password.slice(0, 8)}`;
}

export function generateDummyPassword() {
  const password = generateId();
  const hashedPassword = generateHashedPassword(password);

  return hashedPassword;
}
