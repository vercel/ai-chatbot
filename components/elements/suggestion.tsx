'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ComponentProps, ComponentPropsWithoutRef } from 'react';

// A lightweight horizontal scroller that lets content determine width.
// We avoid Radix ScrollArea here to ensure predictable mobile scrolling.
export type SuggestionsProps = ComponentPropsWithoutRef<'div'>;

export const Suggestions = ({
  className,
  children,
  ...props
}: SuggestionsProps) => (
  <div
    className={cn(
      // Native horizontal scroll with hidden scrollbar on mobile
      'w-full overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [-webkit-overflow-scrolling:touch]',
    )}
    {...props}
  >
    <div className={cn('flex w-max flex-nowrap items-center gap-2 pr-4', className)}>
      {children}
    </div>
  </div>
);

export type SuggestionProps = Omit<ComponentProps<typeof Button>, 'onClick'> & {
  suggestion: string;
  onClick?: (suggestion: string) => void;
};

export const Suggestion = ({
  suggestion,
  onClick,
  className,
  variant = 'outline',
  size = 'sm',
  children,
  ...props
}: SuggestionProps) => {
  const handleClick = () => {
    onClick?.(suggestion);
  };

  return (
    <Button
      className={cn('cursor-pointer rounded-full px-4', className)}
      onClick={handleClick}
      size={size}
      type="button"
      variant={variant}
      {...props}
    >
      {children || suggestion}
    </Button>
  );
};
