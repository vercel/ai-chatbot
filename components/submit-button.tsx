'use client';

import { useFormStatus } from 'react-dom';

import { LoaderIcon } from '@/components/icons';

import { Button } from './ui/button';

export function SubmitButton({
  children,
  isLoading,
}: {
  children: React.ReactNode;
  isLoading: boolean;
}) {
  const { pending } = useFormStatus();
  const isDisabled = pending || isLoading;

  return (
    <Button
      type={isDisabled ? 'button' : 'submit'}
      aria-disabled={isDisabled}
      disabled={isDisabled}
      className="relative"
    >
      {children}

      {isDisabled && (
        <span className="animate-spin absolute right-4">
          <LoaderIcon />
        </span>
      )}

      <output aria-live="polite" className="sr-only">
        {isDisabled ? 'Loading' : 'Submit form'}
      </output>
    </Button>
  );
}
