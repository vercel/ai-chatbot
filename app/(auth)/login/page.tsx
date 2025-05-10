'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from '@/components/toast';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { login, type LoginActionState } from '../actions';
import { useSession } from 'next-auth/react';

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [state, setState] = useState<LoginActionState>({
    status: 'idle',
  });

  const { update: updateSession } = useSession();

  useEffect(() => {
    console.log('Login page state changed:', state.status);
    if (state.status === 'in_progress') {
      setIsLoading(true);
      setErrorMessage(null);
    } else if (state.status === 'failed') {
      console.log('Login failed, showing error message');
      setIsLoading(false);
      setErrorMessage(
        'Invalid credentials. Please check your email and password.',
      );
      toast({
        type: 'error',
        description: 'Invalid credentials!',
      });
    } else if (state.status === 'invalid_data') {
      console.log('Invalid data submitted, showing error message');
      setIsLoading(false);
      setErrorMessage(
        'Please enter a valid email and password (min 6 characters).',
      );
      toast({
        type: 'error',
        description: 'Failed validating your submission!',
      });
    } else if (state.status === 'success') {
      console.log('Login successful, starting session update');
      setIsSuccessful(true);
      // Update session then redirect to home page

      // Add a timeout to prevent infinite loading
      const sessionUpdatePromise = updateSession();
      console.log('updateSession() called, waiting for response...');
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          console.log('Session update timed out after 10 seconds');
          reject(new Error('Session update timed out'));
        }, 10000);
      });

      Promise.race([sessionUpdatePromise, timeoutPromise])
        .then(() => {
          console.log(
            'Session update completed successfully, redirecting to home',
          );
          router.push('/'); // Redirect to home page after successful login
        })
        .catch((error: Error) => {
          console.error('Failed to update session:', error, error.stack);
          setIsLoading(false);
          setErrorMessage(
            error.message === 'Session update timed out'
              ? 'Login timed out. Please try again.'
              : 'Login succeeded but session update failed. Please try again.',
          );
          toast({
            type: 'error',
            description:
              error.message === 'Session update timed out'
                ? 'Login timed out. Please try again.'
                : 'Login succeeded but session update failed. Please try again.',
          });
        });
    }
  }, [state.status, router, updateSession]);

  const handleSubmit = async (formData: FormData) => {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    console.log(
      `Login attempt for email: ${email}, password: ${password ? '********' : 'empty'}`,
    );

    setEmail(email);
    setIsLoading(true);
    setErrorMessage(null);

    // Set in progress status
    setState({ status: 'in_progress' });
    console.log('Calling login action...');

    const result = await login(formData);
    console.log('Login action returned:', result);
    setState(result);
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

        {errorMessage && (
          <Alert variant="destructive" className="mx-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton isSuccessful={isSuccessful}>
            {isLoading ? 'Signing in...' : 'Sign in'}
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
