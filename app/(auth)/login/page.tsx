'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useActionState } from '@/hooks/use-action-state';
import { toast } from '@/components/toast';

import { AuthForm } from '@/components/auth';
import { SubmitButton } from '@/components/submit-button';

import { login, type AuthActionState } from '../actions';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<AuthActionState, FormData>(login, {
    status: 'idle',
    message: undefined,
  });

  useEffect(() => {
    if (state.status === 'error' && state.message) {
      toast({
        type: 'error',
        description: state.message,
      });
    } else if (state.status === 'success') {
      toast({
        type: 'success',
        description: state.message || 'Login successful!',
      });
      setIsSuccessful(true);
      router.refresh();
    }
  }, [state, router]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get('email') as string);
    formAction(formData);
  };

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] items-center justify-center py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to get started
          </p>
        </div>
        <AuthForm type="login" />
      </div>
    </div>
  );
}
