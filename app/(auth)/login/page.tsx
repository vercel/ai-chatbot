'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { toast } from '@/components/toast';
import { ArrowLeftIcon } from '@radix-ui/react-icons';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';
import { Button } from '@/components/ui/button';
import Veil from '@/components/veil';

import { login, type LoginActionState } from '../actions';
import { useSession } from 'next-auth/react';

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    {
      status: 'idle',
    },
  );

  const { update: updateSession } = useSession();

  useEffect(() => {
    if (state.status === 'failed') {
      toast({
        type: 'error',
        description: 'Invalid credentials!',
      });
    } else if (state.status === 'invalid_data') {
      toast({
        type: 'error',
        description: 'Failed validating your submission!',
      });
    } else if (state.status === 'success') {
      setIsSuccessful(true);
      updateSession();
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);
  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get('email') as string);
    formAction(formData);
  };

  return (
    <div className="flex h-screen">
      <div className="relative hidden flex-col items-start justify-between overflow-hidden p-12 md:flex md:w-1/2">
        <div className="absolute inset-0">
          <Veil
            speed={3}
            noiseIntensity={0.8}
          />
        </div>
        
        {/* Back button */}
        <Button
          asChild
          variant="outline"
          size="sm"
          className="relative z-10 border-foreground/30 bg-background/80 text-foreground hover:bg-background hover:text-foreground backdrop-blur-sm"
        >
          <Link href="/">
            <ArrowLeftIcon className="h-4 w-4" />
            Back
          </Link>
        </Button>
        
        
        {/* Bottom promotional section */}
        <div className="relative z-10 text-foreground">
          <h2 className="mb-2 font-bold text-2xl">
            Chat SDK
          </h2>
          <p className="max-w-md text-foreground/70">
            A powerful AI chatbot template built with Next.js, AI SDK, and Vercel AI Gateway for seamless conversations.
          </p>
        </div>
      </div>
      
      <div className="flex w-full flex-col overflow-auto bg-background md:w-1/2">
        <div className="flex flex-1 items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-sm space-y-8">
            {/* Header */}
            <div className="space-y-3 text-center">
              <h1 className="font-bold text-3xl tracking-tight">Welcome back</h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Sign in to continue to Chat SDK
              </p>
            </div>
            
            {/* Form */}
            <div className="space-y-6">
              <AuthForm action={handleSubmit} defaultEmail={email}>
                <SubmitButton isSuccessful={isSuccessful}>Sign in</SubmitButton>
              </AuthForm>
              
              {/* Footer */}
              <div className="text-center">
                <p className="text-muted-foreground text-sm">
                  Don't have an account?{' '}
                  <Link
                    href="/register"
                    className="font-medium text-primary hover:underline underline-offset-4"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
