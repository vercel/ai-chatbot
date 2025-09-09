'use server';
import 'server-only';

import { actionClient, ActionError } from '@/lib/safe-action';
import { SignInSchema, SignUpSchema } from '@/lib/validators';
import { signIn } from '@/app/(auth)/auth';
import { createUser, getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';

export const login = actionClient
  .inputSchema(SignInSchema)
  .action(async ({ parsedInput: { email, password } }) => {
    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res) {
        redirect(res);
      }
    } catch (error) {
      console.error(error);
      throw new ActionError('Failed to sign in with credentials.');
    }
  });

export const register = actionClient
  .inputSchema(SignUpSchema)
  .action(async ({ parsedInput: { email, password } }) => {
    try {
      const [user] = await getUser(email);

      if (user) {
        throw new ActionError('User already exists.');
      }

      await createUser(email, password);
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res) {
        redirect(res);
      }
    } catch (error) {
      console.error(error);

      throw new ActionError('Failed to register with credentials.');
    }
  });
