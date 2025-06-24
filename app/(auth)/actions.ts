'use server';

import { z } from 'zod';
import { 
  createUser, 
  getUser, 
  createEmailVerificationToken, 
  verifyEmailToken, 
  getUserByEmail,
  createPasswordResetToken, 
  getPasswordResetToken, 
  deletePasswordResetToken,
  resetUserPassword,
} from '@/lib/db/queries';
import { signIn } from './auth';
import { sendVerificationEmail, sendPasswordResetEmail } from '@/lib/db/email';

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export interface LoginActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data' | 'email_not_verified';
}

export const login = async (
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  try {
    console.log('=== LOGIN ACTION DEBUG ===');
    
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });
    
    console.log('Login attempt for:', validatedData.email);

    const user = await getUserByEmail(validatedData.email);
    console.log('User found:', !!user);
    
    if (user && !user.email_verified) {
      console.log('Email not verified');
      return { status: 'email_not_verified' };
    }

    console.log('Attempting sign in...');
    const signInResult = await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    console.log('Sign in result:', signInResult);

    if (signInResult?.error) {
      console.log('Sign in failed with error:', signInResult.error);
      return { status: 'failed' };
    }

    console.log('Login successful');
    return { status: 'success' };
  } catch (error) {
    console.error('Login action error:', error);
    
    if (error instanceof z.ZodError) {
      console.log('Validation error:', error.errors);
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
    | 'invalid_data'
    | 'verification_sent';
}

export const register = async (
  _: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> => {
  try {
    console.log('=== REGISTER ACTION DEBUG ===');
    
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });
    
    console.log('Validated data:', { email: validatedData.email });

    // Check if user already exists
    const existingUsers = await getUser(validatedData.email);
    console.log('Existing users found:', existingUsers.length);
    
    if (existingUsers.length > 0) {
      console.log('User already exists');
      return { status: 'user_exists' };
    }
    
    console.log('Creating new user...');
    const newUser = await createUser(validatedData.email, validatedData.password);
    console.log('User created with ID:', newUser.id);
    
    console.log('Creating email verification token...');
    const otp = await createEmailVerificationToken(newUser.id);
    console.log('OTP generated:', otp);
    
    console.log('Sending verification email...');
    await sendVerificationEmail(validatedData.email, otp);
    console.log('Verification email sent successfully');

    return { status: 'verification_sent' };
  } catch (error) {
    console.error('Register action error:', error);
    
    if (error instanceof z.ZodError) {
      console.log('Validation error:', error.errors);
      return { status: 'invalid_data' };
    }
    
    return { status: 'failed' };
  }
};

export interface VerifyEmailActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_token';
}

export const verifyEmail = async (
  _: VerifyEmailActionState,
  formData: FormData,
): Promise<VerifyEmailActionState> => {
  try {
    console.log('=== VERIFY EMAIL ACTION DEBUG ===');
    
    const otp = formData.get('otp') as string;
    console.log('OTP received:', otp);
    
    if (!otp || otp.length !== 6) {
      console.log('Invalid OTP format');
      return { status: 'invalid_token' };
    }

    console.log('Verifying OTP...');
    const result = await verifyEmailToken(otp);
    console.log('Verification result:', result);
    
    if (!result.success) {
      return { status: 'invalid_token' };
    }

    // Auto-login after successful verification
    if (result.userEmail) {
      console.log('Auto-signing in verified user...');
      try {
        await signIn('credentials', {
          email: result.userEmail,
          password: '__EMAIL_VERIFIED__', // Special password for verified users
          redirect: false,
        });
        console.log('Auto sign-in successful');
      } catch (signInError) {
        console.error('Auto sign-in failed:', signInError);
        // Continue with success status anyway
      }
    }

    console.log('Email verified successfully');
    return { status: 'success' };
  } catch (error) {
    console.error('Verify email action error:', error);
    return { status: 'failed' };
  }
};

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
      return { status: 'success' };
    }

    const user = users[0];
    console.log('User found:', { id: user.id, email: user.email, hasPassword: !!user.password });
    
    if (!user.password) {
      console.log('User has no password (OAuth user), returning success');
      return { status: 'success' };
    }

    console.log('Creating password reset token...');
    const token = await createPasswordResetToken(user.id);
    console.log('Token created:', token);
    
    console.log('Attempting to send email...');
    await sendPasswordResetEmail(email, token);
    console.log('Email sent successfully');
    
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

    console.log('=== RESET PASSWORD DEBUG ===');
    console.log('Token received:', token);
    console.log('Password length:', password ? password.length : 0);
    console.log('Passwords match:', password === confirmPassword);

    if (!token || !password || password !== confirmPassword || password.length < 6) {
      console.log('Validation failed');
      return { status: 'failed' };
    }

    console.log('Looking up reset token...');
    const resetToken = await getPasswordResetToken(token);
    if (!resetToken) {
      console.log('Reset token not found');
      return { status: 'invalid_token' };
    }

    console.log('Reset token found:', { 
      userId: resetToken.userId, 
      expiresAt: resetToken.expiresAt,
      currentTime: new Date().toISOString()
    });

    if (new Date(resetToken.expiresAt) < new Date()) {
      console.log('Token expired, deleting...');
      await deletePasswordResetToken(token);
      return { status: 'expired_token' };
    }

    console.log('Resetting password...');
    await resetUserPassword(resetToken.userId, password);
    console.log('Password reset successfully');
    
    console.log('Deleting used token...');
    await deletePasswordResetToken(token);
    console.log('Token deleted');
    
    return { status: 'success' };
  } catch (error) {
    console.error('Reset password error:', error);
    return { status: 'failed' };
  }
};