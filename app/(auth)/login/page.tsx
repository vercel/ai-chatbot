'use client';

import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';
import { toast } from '@/components/toast';
import { login, type LoginActionState } from '../actions';

export default function Page() {
  const [email, setEmail] = useState('');

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    { status: 'idle' },
  );

  useEffect(() => {
    const handleStateChange = () => {
      switch (state.status) {
        case 'failed':
          toast({
            type: 'error',
            description: 'Invalid email or password. Please try again.',
          });
          break;
        case 'invalid_data':
          toast({
            type: 'error',
            description: 'Please check your information and try again.',
          });
          break;
      }
    };

    if (
      state.status !== 'idle' &&
      state.status !== 'in_progress' &&
      state.status !== 'success'
    ) {
      handleStateChange();
    }
  }, [state.status]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get('email') as string);
    formAction(formData);
  };

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Sign In</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Use your email and password to sign in
          </p>
        </div>
        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton isSuccessful={state.status === 'success'}>
            Sign in
          </SubmitButton>
          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            {"Don't have an account? "}
            <Link
              href="/register"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              Sign up
            </Link>
            {' for free.'}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}
