'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { toast } from '@/components/toast';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';

import { login, type LoginActionState } from '../actions';

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [turnstileStatus, setTurnstileStatus] = useState<
    'success' | 'error' | 'expired' | 'required'
  >('required');
  const turnstileRef = useRef<string>('');

  const handleTurnstileStatus = useCallback(
    (status: 'success' | 'error' | 'expired' | 'required') => {
      setTurnstileStatus(status);
    },
    [],
  );

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    {
      status: 'idle',
    },
  );

  useEffect(() => {
    if (state.status === 'failed') {
      handleTurnstileStatus('required');
      toast({
        type: 'error',
        description: 'Invalid credentials!',
      });
    } else if (state.status === 'invalid_data') {
      handleTurnstileStatus('required');
      toast({
        type: 'error',
        description: 'Failed validating your submission!',
      });
    } else if (state.status === 'invalid_captcha') {
      handleTurnstileStatus('required');
      toast({
        type: 'error',
        description: 'Failed validating the reCAPTCHA!',
      });
    } else if (state.status === 'success') {
      setIsSuccessful(true);
      router.refresh();
    }
  }, [state.status]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get('email') as string);
    switch (turnstileStatus) {
      case 'required':
        turnstileRef.current = 'required';
        toast({
          type: 'error',
          description: 'Please complete the reCAPTCHA challenge',
        });
        break;
      case 'expired':
        turnstileRef.current = 'expired';
        toast({
          type: 'error',
          description: 'Please complete the reCAPTCHA challenge',
        });
        break;
      case 'error':
        turnstileRef.current = 'error';
        toast({
          type: 'error',
          description: 'Please complete the reCAPTCHA challenge',
        });
        break;
      case 'success':
        turnstileRef.current = 'success';
        formAction(formData);
        break;
    }
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
        <AuthForm
          action={handleSubmit}
          defaultEmail={email}
          handleTurnstileStatus={handleTurnstileStatus}
          turnstileRef={turnstileRef}
        >
          <SubmitButton isSuccessful={isSuccessful}>Sign in</SubmitButton>
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
