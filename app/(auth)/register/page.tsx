'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';
import { LostMindLogo } from '@/components/lostmind-logo';

import { register, type RegisterActionState } from '../actions';
import { toast } from '@/components/toast';
import { useSession } from 'next-auth/react';

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<RegisterActionState, FormData>(
    register,
    {
      status: 'idle',
    },
  );

  const { update: updateSession } = useSession();

  useEffect(() => {
    if (state.status === 'user_exists') {
      toast({ type: 'error', description: 'Account already exists!' });
    } else if (state.status === 'failed') {
      toast({ type: 'error', description: 'Failed to create account!' });
    } else if (state.status === 'invalid_data') {
      toast({
        type: 'error',
        description: 'Failed validating your submission!',
      });
    } else if (state.status === 'success') {
      toast({ type: 'success', description: 'Account created successfully!' });

      setIsSuccessful(true);
      updateSession();
      router.refresh();
    }
  }, [state, updateSession, router]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get('email') as string);
    formAction(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 relative overflow-hidden">
      {/* Neural network background effect */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_200px,rgba(79,70,229,0.3),transparent)]" />
      </div>
      
      <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 relative z-10">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <LostMindLogo 
              width={80} 
              height={80} 
              showText={true} 
              theme="gradient" 
              animated={true}
            />
            <h1 className="mt-6 text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Join AI Chat
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Create your account to access neural-powered AI chat
            </p>
          </div>
          <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm border border-blue-100 dark:border-blue-900 shadow-xl rounded-2xl p-8">
            <AuthForm action={handleSubmit} defaultEmail={email}>
              <SubmitButton isSuccessful={isSuccessful}>Get Started</SubmitButton>
              <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
                {'Already have an account? '}
                <Link
                  href="/login"
                  className="font-semibold text-blue-600 hover:text-purple-600 transition-colors dark:text-zinc-200"
                >
                  Sign in
                </Link>
                {' instead.'}
              </p>
            </AuthForm>
          </div>
        </div>
      </div>
    </div>
  );
}