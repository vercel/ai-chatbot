'use client';

import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Sign Up</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Create an account with your Cognito account
          </p>
        </div>
        <div className="flex flex-col items-center gap-4 px-4 sm:px-16">
        <button
            onClick={() =>
              signIn('cognito', {
                callbackUrl: '/',
                authorizationParams: { screen_hint: 'signup' }
              })
            }
            style={{
              padding: '1rem 2rem',
              fontSize: '1.2rem',
              borderRadius: '8px',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Sign up with Cognito
          </button>
          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            {"Already have an account? "}
            <Link
              href="/login"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              Sign in
            </Link>
            {' instead.'}
          </p>
        </div>
      </div>
    </div>
  );
}