'use server';

import { signIn } from './auth';

export async function signInWithGoogle() {
  try {
    await signIn('google', {
      redirectTo: '/',
      redirect: true
    });
  } catch (error) {
    console.error('Google sign in error:', error);
    throw error;
  }
} 