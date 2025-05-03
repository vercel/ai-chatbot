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

export async function loginAction(
  prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const result = authFormSchema.safeParse({ email, password });

  if (!result.success) {
    return { status: 'invalid_data' };
  }

  try {
    await apiClient.login({ email, password });
    return { status: 'success' };
  } catch (error) {
    return { status: 'failed' };
  }
}

export interface RegisterActionState {
  status:
    | 'idle'
    | 'in_progress'
    | 'success'
    | 'failed'
    | 'user_exists'
    | 'invalid_data';
}

export async function registerAction(
  prevState: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const organizationId = formData.get('organizationId') as string;

  const result = authFormSchema.safeParse({ email, password });

  if (!result.success) {
    return { status: 'invalid_data' };
  }

  try {
    await apiClient.register({ email, password, organizationId });
    return { status: 'success' };
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      return { status: 'user_exists' };
    }
    return { status: 'failed' };
  }
}
