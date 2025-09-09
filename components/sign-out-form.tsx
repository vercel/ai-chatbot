import Form from 'next/form';

import { authClient } from '@/auth-client';

export const SignOutForm = () => {
  return (
    <Form
      className="w-full"
      action={async () => {
        'use server';

        await authClient.signOut();
      }}
    >
      <button
        type="submit"
        className="w-full text-left px-1 py-0.5 text-red-500"
      >
        Sign out
      </button>
    </Form>
  );
};
