// app/verify-email/page.tsx
'use client';
import { Suspense, useActionState, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyEmail, type VerifyEmailActionState } from '../actions';
import { toast } from '@/components/toast';
import { SubmitButton } from '@/components/submit-button';

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          Loading...
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [otp, setOtp] = useState('');

  const [state, formAction] = useActionState<VerifyEmailActionState, FormData>(
    verifyEmail,
    { status: 'idle' },
  );

  useEffect(() => {
    if (state.status === 'success') {
      toast({ type: 'success', description: 'Email verified successfully!' });
      router.push('/');
    } else if (state.status === 'invalid_token') {
      toast({ type: 'error', description: 'Invalid or expired OTP!' });
    } else if (state.status === 'failed') {
      toast({ type: 'error', description: 'Verification failed!' });
    }
  }, [state, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('otp', otp);
    formAction(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Verify Email
          </h2>
          <p className="text-gray-600">
            Enter the 6-digit code sent to
            <br />
            <span className="font-semibold">{email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="verification-code"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Verification Code
            </label>
            <input
              id="verification-code"
              type="text"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
              }
              className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="000000"
              maxLength={6}
              required
            />
          </div>

          <SubmitButton
            isSuccessful={state.status === 'success'}
            // disabled={otp.length !== 6}
          >
            Verify Email
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
