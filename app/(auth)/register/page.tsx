'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';

import { register, type RegisterActionState } from '../actions';
import { toast } from '@/components/toast';
import { useSession } from 'next-auth/react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function Page() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [state, setState] = useState<RegisterActionState>({
    status: 'idle',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [registrationAllowed, setRegistrationAllowed] = useState(true);

  const { update: updateSession } = useSession();

  useEffect(() => {
    checkRegistrationStatus();
  }, []);

  useEffect(() => {
    if (state.status === 'failed') {
      toast({
        type: 'error',
        description: 'Failed creating your account!',
      });
    } else if (state.status === 'invalid_data') {
      toast({
        type: 'error',
        description: 'Failed validating your submission!',
      });
    } else if (state.status === 'user_exists') {
      toast({
        type: 'error',
        description: 'An account with this email already exists!',
      });
    } else if (state.status === 'success') {
      setIsSuccessful(true);
      // Update session then redirect to home page
      updateSession()
        .then(() => {
          router.push('/'); // Redirect to home page after successful registration
        })
        .catch((error) => {
          console.error('Failed to update session:', error);
          toast({
            type: 'error',
            description:
              'Registration succeeded but session update failed. Please try again.',
          });
        });
    }
  }, [state.status, router, updateSession]);

  async function checkRegistrationStatus() {
    try {
      const response = await fetch('/api/registration-status');
      if (response.ok) {
        const data = await response.json();
        setRegistrationAllowed(data.registrationAllowed);
      } else {
        console.error('Failed to check registration status');
        // Default to allowing registration if we can't check
        setRegistrationAllowed(true);
      }
    } catch (error) {
      console.error('Error checking registration status:', error);
      // Default to allowing registration if we can't check
      setRegistrationAllowed(true);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSubmit = async (formData: FormData) => {
    setEmail(formData.get('email') as string);
    const result = await register(formData);
    setState(result);
  };

  if (!isLoading && !registrationAllowed) {
    return (
      <div className="flex h-dvh w-screen items-center justify-center bg-background">
        <div className="w-full max-w-md overflow-hidden rounded-2xl gap-6 flex flex-col p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Registration Disabled</AlertTitle>
            <AlertDescription>
              Registration is currently disabled on this instance. Please
              contact your administrator for access.
            </AlertDescription>
          </Alert>

          <div className="flex justify-center">
            <Link
              href="/login"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-dvh w-screen items-center justify-center bg-background">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl gap-12 flex flex-col">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Sign Up</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Create an account with your email and password
          </p>
        </div>
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
      </div>
    </div>
  );
}
