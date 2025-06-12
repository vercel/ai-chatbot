'use client';
import Link from 'next/link';
import { useActionState, useState } from 'react';
import { forgotPassword, type ForgotPasswordActionState } from '../actions';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [state, formAction] = useActionState<ForgotPasswordActionState, FormData>(
    forgotPassword,
    { status: 'idle' }
  );

  if (state.status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Check Your Email</h2>
            <p className="text-gray-600 mb-6">
              If an account with that email exists, we&apos;ve sent you a password reset link.
            </p>
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password</h2>
          <p className="text-gray-600 mb-8">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        <form action={formAction} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
            />
          </div>

          {state.status === 'failed' && (
            <p className="text-red-600 text-sm">Something went wrong. Please try again.</p>
          )}

          <button
            type="submit"
            disabled={state.status === 'in_progress'}
            className="w-full bg-[#00B24B] text-white py-2 px-4 rounded-md hover:bg-[#009640] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state.status === 'in_progress' ? 'Sending...' : 'Send Reset Link'}
          </button>

          <div className="text-center">
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
