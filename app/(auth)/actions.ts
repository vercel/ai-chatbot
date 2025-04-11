'use server'

// This file contains placeholder server actions since we're using client-side Google OAuth
// All auth logic is now in the respective components using Google OAuth

export type AuthActionState = {
  status: 'idle' | 'error' | 'success';
  message?: string;
};

/**
 * Placeholder login action for Google OAuth
 * @param formData Form data containing email and password
 * @returns AuthActionState indicating the action status
 */
export async function login(formData: FormData): Promise<AuthActionState> {
  'use server';
  
  // This is a placeholder since we're using client-side Google OAuth
  // The actual auth logic is in the AuthForm component
  return {
    status: 'idle',
    message: undefined
  };
}

/**
 * Placeholder register action for Google OAuth
 * @param formData Form data containing email and password
 * @returns AuthActionState indicating the action status
 */
export async function register(formData: FormData): Promise<AuthActionState> {
  'use server';
  
  // This is a placeholder since we're using client-side Google OAuth
  // The actual auth logic is in the AuthForm component
  return {
    status: 'idle',
    message: undefined
  };
}

/**
 * Placeholder forgot password action for Google OAuth
 * @param formData Form data containing email
 * @returns AuthActionState indicating the action status
 */
export async function forgotPassword(formData: FormData): Promise<AuthActionState> {
  'use server';
  
  // This is a placeholder since we're using client-side Google OAuth
  // The actual auth logic is in the AuthForm component
  return {
    status: 'idle',
    message: undefined
  };
} 