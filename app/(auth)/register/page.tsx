'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';

import { register, type RegisterActionState } from '../actions';
import { toast } from '@/components/toast';
import { useSession } from 'next-auth/react';

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [state, formAction] = useActionState<RegisterActionState, FormData>(
    register,
    {
      status: 'idle',
    },
  );

  const { update: updateSession } = useSession();

  // Validate invitation token on mount
  useEffect(() => {
    if (token) {
      fetch('/api/invitations/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.valid) {
            setIsValidToken(true);
            setEmail(data.email);
          } else {
            setIsValidToken(false);
            setTokenError(data.error || 'Invalid invitation');
          }
        })
        .catch(() => {
          setIsValidToken(false);
          setTokenError('Failed to validate invitation');
        });
    } else {
      setIsValidToken(false);
      setTokenError('No invitation token provided');
    }
  }, [token]);

  useEffect(() => {
    if (state.status === 'user_exists') {
      toast({ type: 'error', description: 'Account already exists!' });
    } else if (state.status === 'failed') {
      toast({ type: 'error', description: 'Failed to create account!' });
    } else if (state.status === 'invalid_data') {
      toast({
        type: 'error',
        description: 'Email must match the invitation!',
      });
    } else if (state.status === 'invalid_token') {
      toast({
        type: 'error',
        description: 'Invalid or expired invitation token!',
      });
    } else if (state.status === 'expired_token') {
      toast({
        type: 'error',
        description: 'This invitation has expired!',
      });
    } else if (state.status === 'success') {
      toast({ type: 'success', description: 'Account created successfully!' });

      setIsSuccessful(true);
      updateSession();
      router.refresh();
    }
  }, [state]);

  const handleSubmit = (formData: FormData) => {
    if (token) {
      formData.append('token', token);
    }
    setEmail(formData.get('email') as string);
    formAction(formData);
  };

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl gap-12 flex flex-col">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Sign Up</h3>
          {isValidToken === null ? (
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              Validating invitation...
            </p>
          ) : isValidToken ? (
            <>
              <p className="text-sm text-gray-500 dark:text-zinc-400">
                You&apos;ve been invited! Create your account below.
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                Invitation for: {email}
              </p>
            </>
          ) : (
            <div className="text-sm text-red-600 dark:text-red-400">
              <p>{tokenError}</p>
              <p className="mt-2">Please request a new invitation to continue.</p>
            </div>
          )}
        </div>
        {isValidToken && (
          <AuthForm action={handleSubmit} defaultEmail={email}>
            <SubmitButton isSuccessful={isSuccessful}>Sign Up</SubmitButton>
            <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
              {'Already have an account? '}
              <Link
                href="/login"
                className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
              >
                Sign in
              </Link>
              {' instead.'}
            </p>
          </AuthForm>
        )}
        {!isValidToken && isValidToken !== null && (
          <div className="flex flex-col items-center gap-4 px-4 sm:px-16">
            <Link
              href="/login"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              Sign in with existing account
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
