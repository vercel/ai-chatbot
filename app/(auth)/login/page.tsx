'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from '@/components/toast';
import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';
import { apiClient } from '@/lib/api-client';

export default function Page() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    try {
      setIsLoading(true);
      setEmail(formData.get('email') as string);

      const response = await apiClient.login({
        email: formData.get('email') as string,
        password: formData.get('password') as string,
      });

      localStorage.setItem('token', response.token);
      setIsSuccessful(true);
      router.push('/');
    } catch (error: any) {
      if (error.status === 401) {
        toast({ type: 'error', description: 'Invalid credentials!' });
      } else {
        toast({ type: 'error', description: 'Failed to sign in!' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-dvh w-full bg-background ">
      <div className="flex w-full h-full  overflow-hidden shadow-md md:flex-row flex-col bg-white dark:bg-zinc-900">

        {/* Left Panel */}
        <div className="w-1/2 flex items-center justify-center bg-[#D1EBEB] text-black p-10 ">
          <div className="max-w-md space-y-4">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-semibold text-green-700">★ Dental AI</h2>
            </div>
            <h1 className="text-3xl font-bold">Chat with exciting tool</h1>
            <p className="text-sm text-gray-800">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-1/2 flex items-center justify-center px-4 py-8 sm:px-6 min-h-[520px]">
          <div className="w-full max-w-md space-y-6">
            <div className="text-left">
              <h3 className="text-lg font-semibold dark:text-zinc-50">Use your email and password to sign in</h3>
            </div>

            <AuthForm action={handleSubmit} defaultEmail={email}>
              <SubmitButton isSuccessful={isSuccessful} isLoading={isLoading} >
                sign in
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
      </div>
    </div>
  );
}
