'use server';

import { z } from 'zod';

import { createUser, getUser } from '@/lib/db/queries';

import { signIn } from './auth';

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export interface LoginActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data';
}

export const login = async (formData: FormData): Promise<LoginActionState> => {
  console.log('Login action started');
  try {
    const email = formData.get('email');
    const password = formData.get('password');
    console.log(
      `Validating login data - Email: ${email}, Password: ${password ? '[PROVIDED]' : '[EMPTY]'}`,
    );

    const validatedData = authFormSchema.parse({
      email: email,
      password: password,
    });
    console.log('Validation passed, attempting signIn with credentials');

    try {
      console.log('Calling signIn("credentials")...');
      const result = await signIn('credentials', {
        email: validatedData.email,
        password: validatedData.password,
        redirect: false,
      });
      console.log('signIn result:', result);

      if (result?.error) {
        console.error('Login error:', result.error);
        return { status: 'failed' };
      }

      console.log('Login successful');
      return { status: 'success' };
    } catch (signInError) {
      console.error('SignIn error:', signInError);
      console.error(
        'Error details:',
        signInError instanceof Error ? signInError.message : 'Unknown error',
        signInError instanceof Error ? signInError.stack : '',
      );
      return { status: 'failed' };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return { status: 'invalid_data' };
    }

    console.error('Unexpected login error:', error);
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

    try {
      await createUser(validatedData.email, validatedData.password);

      const result = await signIn('credentials', {
        email: validatedData.email,
        password: validatedData.password,
        redirect: false,
      });

      if (result?.error) {
        console.error('Registration login error:', result.error);
        return { status: 'failed' };
      }

      return { status: 'success' };
    } catch (signInError) {
      console.error('Registration error:', signInError);
      return { status: 'failed' };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

    return { status: 'failed' };
  }
};
