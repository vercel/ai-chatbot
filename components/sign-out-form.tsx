'use client';

import Form from 'next/form';
import { useTranslations } from 'next-intl';

import { signOut } from '@/app/(auth)/auth';

export const SignOutForm = () => {
  const t = useTranslations('Auth');

  return (
    <Form
      className="w-full"
      action={async () => {
        'use server';

        await signOut({
          redirectTo: '/',
        });
      }}
    >
      <button
        type="submit"
        className="w-full text-left px-1 py-0.5 text-red-500"
      >
        {t('signOut')}
      </button>
    </Form>
  );
};
