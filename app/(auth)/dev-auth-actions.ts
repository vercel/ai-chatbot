'use server';

import { getUser } from '@/lib/db/queries';
import { signIn } from './auth';

// Only allow in development/preview
const isDevelopment = process.env.NODE_ENV === 'development' || 
                     process.env.VERCEL_ENV === 'preview';

export interface ImpersonateActionState {
  status: 'idle' | 'success' | 'failed' | 'not_found';
}

export async function impersonateUser(
  email: string
): Promise<ImpersonateActionState> {
  if (!isDevelopment) {
    console.error('Impersonation only allowed in development/preview environments');
    return { status: 'failed' };
  }

  try {
    const [user] = await getUser(email);
    if (!user) {
      console.error('User not found:', email);
      return { status: 'not_found' };
    }

    // Use a special development-only provider for impersonation
    await signIn('dev-impersonate', {
      id: user.id,
      email: user.email,
      name: user.name,
      redirect: false
    });

    return { status: 'success' };
  } catch (error) {
    console.error('Impersonation error:', error);
    return { status: 'failed' };
  }
} 