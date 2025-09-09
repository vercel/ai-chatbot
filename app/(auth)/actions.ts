'use server';
import 'server-only';

import { actionClient } from '@/lib/safe-action';
import { SignInSchema, SignUpSchema } from '@/lib/validators';
import { signIn } from '@/app/(auth)/auth';
import { createUser, getUser } from '@/lib/db/queries';
import { returnValidationErrors } from 'next-safe-action';
import { redirect } from 'next/navigation';

export const login = actionClient
  .inputSchema(SignInSchema)
  .action(async ({ parsedInput: { email, password } }) => {
    await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    redirect('/');
  });

export const register = actionClient
  .inputSchema(SignUpSchema)
  .action(async ({ parsedInput: { email, password } }) => {
    const [user] = await getUser(email);

    if (user) {
      return returnValidationErrors(SignUpSchema, { _errors: ["User already exists"] });
    }

    await createUser(email, password);
    await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    redirect('/');
  });
