'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long'),
});

export interface LoginActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data';
}

export interface RegisterActionState {
  status:
    | 'idle'
    | 'in_progress'
    | 'success'
    | 'failed'
    | 'invalid_data'
    | 'user_exists';
}

export const login = async (
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  try {
    const validatedData = loginSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    await auth.api.signInEmail({
      body: {
        ...validatedData,
        callbackURL: '/',
        rememberMe: false,
      },
    });

    redirect('/');
  } catch (error) {
    console.error('Login error:', error);

    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

    return { status: 'failed' };
  }
};

export const register = async (
  _: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> => {
  try {
    const validatedData = registerSchema.parse({
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
    });

    // Create user account - Better Auth will handle auto-signin
    await auth.api.signUpEmail({
      body: {
        ...validatedData,
        callbackURL: '/login',
      },
    });

    return { status: 'success' };
  } catch (error) {
    console.error('Registration error:', error);

    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

    // Handle Better Auth specific errors
    if (error instanceof Error) {
      if (
        error.message.includes('already exists') ||
        error.message.includes('User already exists') ||
        error.message.includes('duplicate')
      ) {
        return { status: 'user_exists' };
      }
    }

    return { status: 'failed' };
  }
};
