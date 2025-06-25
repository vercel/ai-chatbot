'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { toast } from '@/components/toast';
import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';
import { LogoGoogle } from '@/components/google-logo';
import { login, type LoginActionState } from '../actions';

export default function LoginPage() {
  const router = useRouter();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(true);

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    {
      status: 'idle',
    },
  );

  useEffect(() => {
    // Hide placeholder after component is loaded
    const timer = setTimeout(() => {
      setShowPlaceholder(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

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
      router.refresh();
    }
  }, [state.status, router]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get('email') as string);
    formAction(formData);
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      console.log('Starting Google sign in...');

      // Direct redirect to Google OAuth - this should work now
      const result = await signIn('google', {
        callbackUrl: '/',
        redirect: true, // Explicitly enable redirect
      });

      console.log('Sign in result:', result);

      // This code won't execute if redirect is successful
      if (result?.error) {
        console.error('Sign in error:', result.error);
        toast({
          type: 'error',
          description: 'Failed to sign in with Google',
        });
        setIsGoogleLoading(false);
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      toast({
        type: 'error',
        description: 'An error occurred during Google sign in',
      });
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Illustration */}
      <div className="w-1/2 bg-white relative overflow-hidden flex flex-col justify-center items-center p-12">
        <div className="absolute inset-0 bg-white" />

        {/* Storyset Illustration */}
        <div className="relative z-10 mb-8 w-full max-w-md">
          <Image
            src="/images/signin.svg"
            alt="Login illustration"
            width={400}
            height={300}
            className="w-full h-auto"
            priority
          />
        </div>

        {/* Decorative elements */}
      </div>

      {/* Right side - Login Form */}
      <div className="w-1/2 flex items-center justify-center p-12 bg-white">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-lg shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06),4px_0_6px_-1px_rgba(0,0,0,0.1)] p-4">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                CoCo Login
              </h2>
              <p className="text-gray-600 text-lg">
                Enter your provided credentials
              </p>
            </div>

            {/* Show placeholder while loading */}
            {showPlaceholder && (
              <div className="space-y-4 animate-pulse">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24" />
                  <div className="h-10 bg-gray-200 rounded" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20" />
                  <div className="h-10 bg-gray-200 rounded" />
                </div>
                <div className="h-10 bg-[#00B24B] rounded" />
                <div className="h-10 bg-gray-200 rounded" />
              </div>
            )}

            {/* Custom Auth Form */}
            <div
              className={showPlaceholder ? 'opacity-0 absolute' : 'opacity-100'}
            >
              <div className="space-y-4">
                <AuthForm action={handleSubmit} defaultEmail={email}>
                  <SubmitButton isSuccessful={isSuccessful}>
                    Sign in
                  </SubmitButton>

                  {/* Forgot Password Link */}
                  <p className="text-center text-sm text-gray-600 mt-2">
                    <Link
                      href="/forgot-password"
                      className="text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      Forgot your password?
                    </Link>
                  </p>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 bg-white hover:bg-gray-50 hover:text-gray-900 h-10 px-4 py-2 w-full"
                  >
                    <span className="mr-2">
                      <LogoGoogle />
                    </span>
                    {isGoogleLoading ? 'Signing in...' : 'Continue with Google'}
                  </button>

                  <p className="text-center text-sm text-gray-600 mt-4">
                    {"Don't have an account? "}
                    <Link
                      href="/register"
                      className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
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
      </div>
    </div>
  );
}
