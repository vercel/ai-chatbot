'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';
import { register, type RegisterActionState } from '../actions';
import { toast } from '@/components/toast';

export default function Page() {
  const router = useRouter();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  
  const [state, formAction] = useActionState<RegisterActionState, FormData>(
    register,
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
      router.refresh();
    }
  }, [state]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get('email') as string);
    formAction(formData);
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      const result = await signIn('google', {
        callbackUrl: '/',
        redirect: false,
      });
      if (result?.error) {
        toast({
          type: 'error',
          description: 'Failed to sign in with Google',
        });
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      toast({
        type: 'error',
        description: 'An error occurred during Google sign in',
      });
    } finally {
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
          <img 
            src="/images/signup.svg" 
            alt="Sign up illustration"
            className="w-full h-auto"
          />
        </div>
        
        {/* Decorative elements */}
      
      </div>
      
      {/* Right side - Signup Form */}
      <div className="w-1/2 flex items-center justify-center p-12 bg-white">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-lg shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06),4px_0_6px_-1px_rgba(0,0,0,0.1)] p-4">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">CoCo Sign Up</h2>
              <p className="text-gray-600 text-lg">Create your account</p>
            </div>
          
          {/* Show placeholder while loading */}
          {showPlaceholder && (
            <div className="space-y-4 animate-pulse">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
              <div className="h-10 bg-[#00B24B] rounded"></div>
            </div>
          )}
          
          {/* Custom Auth Form */}
          <div className={showPlaceholder ? 'opacity-0 absolute' : 'opacity-100'}>
            <div className="space-y-4">
              <AuthForm action={handleSubmit} defaultEmail={email}>
                <SubmitButton 
                  isSuccessful={isSuccessful}
                  className="w-full h-11"
                >
                  Sign Up
                </SubmitButton>
                {/* <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full"
                >
                  <span className="mr-2 size-4"><LogoGoogle /></span>
                  {isGoogleLoading ? 'Signing in...' : 'Continue with Google'}
                </button> */}
                <p className="text-center text-sm text-gray-600 mt-4">
                  {'Already have an account? '}
                  <Link
                    href="/login"
                    className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
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
      </div>
    </div>
  );
}