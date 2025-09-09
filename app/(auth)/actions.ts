'use server';
import 'server-only';

import { actionClient, ActionError } from '@/lib/safe-action';
import { SignInSchema } from '@/lib/validators';
import { redirect } from 'next/navigation';
import { Route } from 'next';
import { signIn } from '@/app/(auth)/auth';

export const login = actionClient
  .schema(SignInSchema)
  .action(async ({ parsedInput: { email } }) => {
    const res = (await signIn('resend', {
      email,
      redirect: false,
    })) as Route;

    // if (res) redirect(res);
    // throw new ActionError("Failed to sign in with magic link.");
  });

export const signInWithKeycloak = async () => {
  const res = (await signIn('keycloak', {
    redirect: false,
  })) as Route;

  if (res) redirect(res);
  throw new ActionError('Failed to sign in with keycloak.');
};
