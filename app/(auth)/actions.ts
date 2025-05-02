'use server';

import { z } from 'zod';
import { apiClient } from '@/lib/api-client';

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export interface LoginActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data';
}

export interface GuestLoginActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed';
}

export const guestLogin = async (): Promise<GuestLoginActionState> => {
  try {
    await apiClient.guestLogin();
    return { status: 'success' };
  } catch (error) {
    return { status: 'failed' };
  }
};

export const login = async (
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });
    console.log("HERE");
    await apiClient.login({
      email: validatedData.email,
      password: validatedData.password,
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

    try {
      await apiClient.register({
        email: validatedData.email,
        password: validatedData.password,
        organizationId: '', // This will be handled by the backend
      });
      return { status: 'success' };
    } catch (error: any) {
      if (error.status === 409) { // Assuming 409 is used for user exists
        return { status: 'user_exists' };
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

    return { status: 'failed' };
  }
};
