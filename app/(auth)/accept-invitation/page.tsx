'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

interface InvitationData {
  email: string;
  organizationName: string;
  role: string;
  inviterEmail: string;
  isExpired: boolean;
}

export default function AcceptInvitationPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link');
      setIsLoading(false);
      return;
    }

    // Fetch invitation details
    fetch(`/api/auth/invitation/${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setInvitation(data);
        }
      })
      .catch(err => {
        setError('Failed to load invitation');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    setIsAccepting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const password = formData.get('password') as string;
      const confirmPassword = formData.get('confirmPassword') as string;

      if (password !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      const response = await fetch('/api/auth/accept-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Account created successfully! Please sign in.');
        router.push('/login');
      } else {
        toast.error(result.error || 'Failed to accept invitation');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsAccepting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto flex h-screen w-screen flex-col items-center justify-center">
        <div className="animate-pulse">Loading invitation...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto flex h-screen w-screen flex-col items-center justify-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-red-600">
              Invalid Invitation
            </h1>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <div className="text-center">
            <Link
              href="/register-organization"
              className="underline underline-offset-4 hover:text-primary"
            >
              Create a new organization
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (invitation?.isExpired) {
    return (
      <div className="container mx-auto flex h-screen w-screen flex-col items-center justify-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-red-600">
              Invitation Expired
            </h1>
            <p className="text-sm text-muted-foreground">
              This invitation has expired. Please request a new one from your administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Join {invitation?.organizationName}
          </h1>
          <p className="text-sm text-muted-foreground">
            You&apos;ve been invited by {invitation?.inviterEmail} to join as a{' '}
            <span className="font-medium">{invitation?.role}</span>
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={invitation?.email || ''}
              disabled
              className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isAccepting}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isAccepting}
            />
          </div>

          <button
            type="submit"
            disabled={isAccepting}
            className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            {isAccepting ? 'Creating Account...' : 'Accept Invitation'}
          </button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/login"
            className="underline underline-offset-4 hover:text-primary"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}