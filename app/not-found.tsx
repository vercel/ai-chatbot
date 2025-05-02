import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-6xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">404</h1>
        <h2 className="text-3xl font-semibold text-zinc-700 dark:text-zinc-300 mb-6">
          Page not found
        </h2>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8">
          Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or never existed.
        </p>
        <Button asChild>
          <Link href="/">
            Return to Home
          </Link>
        </Button>
      </div>
    </div>
  );
}