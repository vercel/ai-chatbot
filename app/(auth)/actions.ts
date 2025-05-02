'use server';

import { signIn, signOut } from './auth';
import { AuthError } from 'next-auth';
import { createUser, getUser } from '@/lib/db/queries';

export async function signOutAction(redirectTo = '/') {
  await signOut({
    redirectTo,
  });
}

export type LoginActionState = {
  status: 'idle' | 'failed' | 'success' | 'invalid_data';
};

export async function login(
  prevState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  try {
    // Get form data
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    // Basic validation
    if (!email || !password) {
      return { status: 'invalid_data' };
    }
    
    // Use the NextAuth signIn function to authenticate the user
    await signIn('credentials', { 
      email, 
      password,
      redirect: false
    });
    
    return { status: 'success' };
  } catch (error) {
    if (error instanceof AuthError) {
      return { status: 'failed' };
    }
    throw error;
  }
}

export type RegisterActionState = {
  status: 'idle' | 'user_exists' | 'failed' | 'success' | 'invalid_data';
};

export async function register(
  prevState: RegisterActionState,
  formData: FormData
): Promise<RegisterActionState> {
  try {
    // Get form data
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    // Basic validation
    if (!email || !password) {
      return { status: 'invalid_data' };
    }

    // Check if user already exists
    const existingUser = await getUser(email);
    if (existingUser.length > 0) {
      return { status: 'user_exists' };
    }
    
    // Create the user account
    await createUser(email, password);

    // Sign in the user automatically after registration
    await signIn('credentials', { 
      email, 
      password,
      redirect: false
    });
    
    return { status: 'success' };
  } catch (error) {
    console.error('Registration error:', error);
    return { status: 'failed' };
  }
}
