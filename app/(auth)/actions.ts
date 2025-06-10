'use server';

import { z } from 'zod';
import { createUser, getUser } from '@/lib/db/queries';
import { signIn } from './auth';
import { 
  createPasswordResetToken, 
  getPasswordResetToken, 
  deletePasswordResetToken,
  resetUserPassword
} from '@/lib/db/queries';
import { sendPasswordResetEmail } from '@/lib/db/email';

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export interface LoginActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data';
}

export const login = async (
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }
    return { status: 'failed' };
  }
};

export interface RegisterActionState {
  status:
    | 'idle'
    | 'in_progress'
    | 'success'
    | 'failed'
    | 'user_exists'
    | 'invalid_data';
}

export const register = async (
  _: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    const [user] = await getUser(validatedData.email);

    if (user) {
      return { status: 'user_exists' } as RegisterActionState;
    }
    
    await createUser(validatedData.email, validatedData.password);
    await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }
    return { status: 'failed' };
  }
};

// Server action for Google sign-in (optional - you can handle this client-side)
export const signInWithGoogle = async () => {
  try {
    await signIn('google', { 
      callbackUrl: '/',
      redirectTo: '/'
    });
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
};

export interface ForgotPasswordActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'user_not_found';
}

export const forgotPassword = async (
  _: ForgotPasswordActionState,
  formData: FormData,
): Promise<ForgotPasswordActionState> => {
  try {
    const email = formData.get('email') as string;
    console.log('=== FORGOT PASSWORD DEBUG ===');
    console.log('Email received:', email);
    
    if (!email || !email.includes('@')) {
      console.log('Invalid email format');
      return { status: 'failed' };
    }

    console.log('Looking up user...');
    const users = await getUser(email);
    console.log('Users found:', users.length);
    
    if (users.length === 0) {
      console.log('No users found, but returning success for security');
      // Don't reveal if user exists or not for security
      return { status: 'success' };
    }

    const user = users[0];
    console.log('User found:', { id: user.id, email: user.email, hasPassword: !!user.password });
    
    if (!user.password) {
      console.log('User has no password (OAuth user), returning success');
      // User signed up with Google, no password to reset
      return { status: 'success' };
    }

    console.log('Creating password reset token...');
    const token = await createPasswordResetToken(user.id);
    console.log('Token created:', token);
    
    console.log('Attempting to send email...');
    // Send password reset email
    await sendPasswordResetEmail(email, token);
    console.log('Email function completed successfully');
    
    return { status: 'success' };
  } catch (error) {
    console.error('Forgot password error:', error);
    return { status: 'failed' };
  }
};

export interface ResetPasswordActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_token' | 'expired_token';
}

export const resetPassword = async (
  _: ResetPasswordActionState,
  formData: FormData,
): Promise<ResetPasswordActionState> => {
  try {
    const token = formData.get('token') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!token || !password || password !== confirmPassword || password.length < 6) {
      return { status: 'failed' };
    }

    const resetToken = await getPasswordResetToken(token);
    if (!resetToken) {
      return { status: 'invalid_token' };
    }

    if (new Date(resetToken.expiresAt) < new Date()) {
      await deletePasswordResetToken(token);
      return { status: 'expired_token' };
    }

    await resetUserPassword(resetToken.userId, password);
    await deletePasswordResetToken(token);
    
    return { status: 'success' };
  } catch (error) {
    console.error('Reset password error:', error);
    return { status: 'failed' };
  }
};