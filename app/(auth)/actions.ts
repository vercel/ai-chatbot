'use server';

import { z } from 'zod';
import { v4 as generateRandomUUID } from 'uuid';

import { createUser, getUser } from '@/lib/db/queries';

import { signIn } from './auth';
import { validateTurnstileToken } from 'next-turnstile';

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
export interface LoginActionState {
  status:
    | 'idle'
    | 'in_progress'
    | 'success'
    | 'failed'
    | 'invalid_data'
    | 'invalid_captcha';
}

export const login = async (
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  try {
    const validationResponse = await validateTurnstileToken({
      token: formData.get('cf-turnstile-response')?.toString() ?? '',
      secretKey: process.env.TURNSTILE_SECRET_KEY!,
      idempotencyKey: generateRandomUUID(),
      sandbox: process.env.NODE_ENV === 'development',
    });

    if (!validationResponse.success) {
      return { status: 'invalid_captcha' };
    }

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
    | 'invalid_data'
    | 'invalid_captcha';
}

export const register = async (
  _: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> => {
  try {
    const validationResponse = await validateTurnstileToken({
      token: formData.get('cf-turnstile-response')?.toString() ?? '',
      secretKey: process.env.TURNSTILE_SECRET_KEY!,
      idempotencyKey: generateRandomUUID(),
      sandbox: process.env.NODE_ENV === 'development',
    });

    if (!validationResponse.success) {
      return { status: 'invalid_captcha' };
    }

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
