'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('App-level error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">Something went wrong</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8">
          We're sorry, but something went wrong. Our team has been notified.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={reset} variant="default">
            Try again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">
              Return to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}