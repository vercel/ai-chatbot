'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useActionState, useEffect, useState } from 'react';
import { resetPassword, type ResetPasswordActionState } from '../actions';
import { Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          Loading...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [state, formAction] = useActionState<
    ResetPasswordActionState,
    FormData
  >(resetPassword, { status: 'idle' });

  useEffect(() => {
    if (state.status === 'success') {
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    }
  }, [state.status, router]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="max-w-md w-full text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Invalid Reset Link
          </h2>
          <p className="text-gray-600">
            This password reset link is invalid or has expired.
          </p>
          <Link
            href="/forgot-password"
            className="text-blue-600 hover:text-blue-700"
          >
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  if (state.status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="max-w-md w-full text-center space-y-4">
          <h2 className="text-2xl font-bold text-green-600">
            Password Reset Successfully!
          </h2>
          <p className="text-gray-600">Redirecting to login page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Reset Password
          </h2>
          <p className="text-gray-600 mb-8">Enter your new password below.</p>
        </div>

        <form action={formAction} className="space-y-6">
          <input type="hidden" name="token" value={token} />

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              New Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="size-5" />
                ) : (
                  <Eye className="size-5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? (
                  <EyeOff className="size-5" />
                ) : (
                  <Eye className="size-5" />
                )}
              </button>
            </div>
          </div>

          {password && confirmPassword && password !== confirmPassword && (
            <p className="text-red-600 text-sm">Passwords do not match.</p>
          )}

          {state.status === 'failed' && (
            <p className="text-red-600 text-sm">
              Failed to reset password. Please try again.
            </p>
          )}

          {state.status === 'invalid_token' && (
            <p className="text-red-600 text-sm">
              Invalid reset token. Please request a new reset link.
            </p>
          )}

          {state.status === 'expired_token' && (
            <p className="text-red-600 text-sm">
              Reset token has expired. Please request a new reset link.
            </p>
          )}

          <button
            type="submit"
            disabled={
              state.status === 'in_progress' ||
              password !== confirmPassword ||
              !password
            }
            className="w-full bg-[#00B24B] text-white py-2 px-4 rounded-md hover:bg-[#009640] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state.status === 'in_progress' ? 'Resetting...' : 'Reset Password'}
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
