'use client';

import { useFormStatus } from 'react-dom';

import { LoaderIcon } from '@/components/icons';

import { Button } from './ui/button';

export function SubmitButton({
  children,
  isSuccessful,
  isLoading,
}: {
  children: React.ReactNode;
  isSuccessful: boolean;
  isLoading?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type={pending || isLoading ? 'button' : 'submit'}
      aria-disabled={pending || isSuccessful || isLoading}
      disabled={pending || isSuccessful || isLoading}
      className="relative"
    >
      {children}

      {(pending || isSuccessful || isLoading) && (
        <span className="animate-spin absolute right-4">
          <LoaderIcon />
        </span>
      )}

      <output aria-live="polite" className="sr-only">
        {pending || isSuccessful || isLoading ? 'Loading' : 'Submit form'}
      </output>
    </Button>
  );
}
