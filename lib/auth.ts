import { getUser } from '@civic/auth-web3/nextjs';
import { User, isValidUser } from './types/auth';
import { user as userTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createUser, getUser as getDbUser } from './db/queries';

export async function getTypedUser(): Promise<User | null> {
  const civicUser = await getUser();
  console.log('Civic User:', civicUser); // Keep for debugging
  
  if (!civicUser || !isValidUser(civicUser)) {
    return null;
  }

  try {
    const [dbUser] = await getDbUser(civicUser.email);

    if (!dbUser) {
      console.log('Creating new user in DB:', civicUser.id); // Debug log
      await createUser({
        id: civicUser.id,
        email: civicUser.email,
      });
    }
    
    return civicUser;
  } catch (error) {
    console.error('DB Error:', error); // Debug log
    return null;
  }
} 