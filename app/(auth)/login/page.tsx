import type { Metadata } from 'next';
import { CardWrapper } from '@/components/auth/card-wrapper';

import { MessageSquare } from 'lucide-react';
import { AbstractImage } from '../../../components/auth/abstract-image';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Login to AI Chatbot',
};

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  return (
    <div className="flex h-dvh w-screen items-start justify-center bg-background pt-12 md:items-center md:pt-0">
      <div className="flex w-full max-w-md flex-col gap-12 overflow-hidden rounded-2xl">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="font-semibold text-xl dark:text-zinc-50">Sign In</h3>
          <p className="text-gray-500 text-sm dark:text-zinc-400">
            Use your email and password to sign in
          </p>
        </div>
        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton isSuccessful={isSuccessful}>Sign in</SubmitButton>
          <p className="mt-4 text-center text-gray-600 text-sm dark:text-zinc-400">
            {"Don't have an account? "}
            <Link
              href="/register"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              <LoginForm />
            </CardWrapper>
          </div>
        </div>
      </div>
    </>
  );
}