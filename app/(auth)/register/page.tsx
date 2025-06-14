'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from '@/components/toast';
import { SubmitButton } from '@/components/submit-button';
import { apiClient } from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import image from '@/public/images/circle.png';

export default function Page() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [employees, setEmployees] = useState('');
  const [ein, setEin] = useState('');

  const handleFinalSubmit = async () => {
    if (password !== confirmPassword) {
      toast({ type: 'error', description: 'Passwords do not match!' });
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiClient.createOrganization({
        name,
        email,
        password,
        organizationId: businessName,
      });

      localStorage.setItem('token', response.token);
      setIsSuccessful(true);
      router.push('/');
    } catch (error: any) {
      if (error.status === 409) {
        toast({ type: 'error', description: 'Account already exists!' });
      } else {
        toast({ type: 'error', description: 'Failed to create account!' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-dvh w-full bg-background">
      <div className="flex w-full h-full overflow-hidden shadow-md md:flex-row flex-col bg-white dark:bg-zinc-900">
        {/* Left Panel */}
        <div className="w-1/2 flex items-center justify-center bg-[#f1e7da] text-black p-10">
          <div className="max-w-md text-left space-y-5">
            <div className="flex items-center space-x-2">
              <img src="/images/circle.png" alt="image" />
              <h2 className="text-lg font-semibold text-black-700">
                DentaMind AI
              </h2>
            </div>
            {/* Stepper UI */}
            <div className="mt-10 space-y-8">
              <div className="flex flex-col space-y-6">
                {/* Step 1 */}
                <div className="flex items-start space-x-4">
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 flex items-center justify-center rounded-full bg-black text-white text-xs font-bold">
                      ✓
                    </div>
                    <div className="w-px py-2 h-10 bg-gray-400 mt-4" />
                  </div>
                  <div className="text-black font-semibold text-sm">
                    Business Information
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start  space-x-4">
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 flex items-center justify-center rounded-full border-2 border-gray-400 text-gray-400 text-xs"></div>
                  </div>
                  <div className="text-gray-500 text-sm">Business Address</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-1/2 flex items-center justify-center px-4 py-8 sm:px-6 min-h-[520px]">
          <div className="w-full max-w-md space-y-6">
            <div className="text-left">
              <h3 className="text-xl font-semibold dark:text-zinc-50">
                Create your account
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
                {step === 1 && 'Let’s start with your contact details'}
                {step === 2 && 'Set up a secure password'}
                {step === 3 && 'Tell us about your business'}
              </p>
            </div>

            <div className="space-y-4">
              {step === 1 && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setStep(2);
                  }}
                  className="space-y-4"
                >
                  <InputBlock
                    label="Full Name"
                    id="name"
                    value={name}
                    onChange={setName}
                    required
                  />
                  <InputBlock
                    label="Email Address"
                    id="email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    required
                  />
                  <InputBlock
                    label="Phone Number"
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={setPhone}
                    required
                  />
                  <div className="flex justify-center mt-4">
                    <button
                      type="submit"
                      className="w-full bg-black text-white rounded-md py-2"
                    >
                      Confirm
                    </button>
                  </div>
                </form>
              )}

              {step === 2 && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (password !== confirmPassword) {
                      toast({
                        type: 'error',
                        description: 'Passwords do not match!',
                      });
                      return;
                    }
                    setStep(3);
                  }}
                  className="space-y-4"
                >
                  <InputBlock
                    label="Password"
                    id="password"
                    type="password"
                    value={password}
                    onChange={setPassword}
                    required
                  />
                  <InputBlock
                    label="Confirm Password"
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    required
                  />
                  <div className="flex flex-col sm:flex-row justify-between gap-2 mt-4">
                    <BackButton onClick={() => setStep(1)} />
                    <button
                      type="submit"
                      className="w-full bg-black text-white rounded-md py-2"
                    >
                      Confirm
                    </button>
                  </div>
                </form>
              )}

              {step === 3 && (
                <>
                  <InputBlock
                    label="Legal Business Name"
                    id="businessName"
                    value={businessName}
                    onChange={setBusinessName}
                    required
                  />
                  <InputBlock
                    label="Type of Business"
                    id="businessType"
                    value={businessType}
                    onChange={setBusinessType}
                    required
                  />
                  <InputBlock
                    label="Industry"
                    id="industry"
                    value={industry}
                    onChange={setIndustry}
                    required
                  />
                  <InputBlock
                    label="Business Website"
                    id="website"
                    type="url"
                    value={website}
                    onChange={setWebsite}
                    required
                  />
                  <InputBlock
                    label="Number of Employees"
                    id="employees"
                    type="number"
                    value={employees}
                    onChange={setEmployees}
                    required
                  />
                  <div className="flex flex-col sm:flex-row justify-between gap-2 mt-4">
                    <BackButton onClick={() => setStep(2)} />
                    <SubmitButton
                      isLoading={isLoading}
                      isSuccessful={isSuccessful}
                      onClick={handleFinalSubmit}
                    >
                      Sign Up
                    </SubmitButton>
                  </div>
                </>
              )}
            </div>

            <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable Components

function InputBlock({ label, id, type = 'text', value, onChange }: any) {
  return (
    <div className="flex flex-col gap-2">
      <Label
        htmlFor={id}
        className="text-zinc-600 font-normal dark:text-zinc-400"
      >
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      />
    </div>
  );
}

function NextButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-black text-white rounded-md py-2"
    >
      Confirm
    </button>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-gray-200 text-gray-800 dark:bg-zinc-700 dark:text-white rounded-md py-2 hover:bg-gray-300 font-medium"
    >
      Back
    </button>
  );
}
