'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { toast } from '@/components/toast';
import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';
import { login, type LoginActionState } from '../actions';

export default function LoginPage() {
  const router = useRouter();
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

  return (
    <div className="min-h-screen flex">
      {/* Left side - Illustration */}
      <div className="w-1/2 bg-white relative overflow-hidden flex flex-col justify-center items-center p-12">
        <div className="absolute inset-0 bg-white" />
        
        {/* Storyset Illustration */}
        <div className="relative z-10 mb-8 w-full max-w-md">
          <img 
            src="/images/signin.svg" 
            alt="Login illustration"
            className="w-full h-auto"
          />
        </div>
        
        {/* Decorative elements */}
      
      </div>
      
      {/* Right side - Login Form */}
      <div className="w-1/2 flex items-center justify-center p-12 bg-white">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-lg shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06),4px_0_6px_-1px_rgba(0,0,0,0.1)] p-4">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">CoCo Login</h2>
              <p className="text-gray-600 text-lg">Enter your provided credentials</p>
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
                  Sign in
                </SubmitButton>
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