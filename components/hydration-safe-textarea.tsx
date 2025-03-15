'use client';

import React, { forwardRef, useEffect, useRef, type ForwardedRef, type TextareaHTMLAttributes } from 'react';
import { Textarea } from './ui/textarea';

interface HydrationSafeTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  value?: string;
  onHeightChange?: () => void;
  className?: string;
}

/**
 * A textarea component that's safe against hydration mismatches
 * caused by browser extensions like Grammarly.
 */
export const HydrationSafeTextarea = forwardRef(function HydrationSafeTextarea(
  { value, onChange, onHeightChange, className, ...props }: HydrationSafeTextareaProps,
  forwardedRef: ForwardedRef<HTMLTextAreaElement>
) {
  const internalRef = useRef<HTMLTextAreaElement | null>(null);
  
  // Handle Grammarly and other extensions by using useEffect
  useEffect(() => {
    // Sync the forwarded ref with our internal ref
    if (typeof forwardedRef === 'function') {
      if (internalRef.current) {
        forwardedRef(internalRef.current);
      }
    } else if (forwardedRef) {
      forwardedRef.current = internalRef.current;
    }
    
    // If extensions like Grammarly add elements, this will run after hydration
    // which avoids the hydration mismatch errors
  }, [forwardedRef]);

  // Auto-adjust height if needed
  useEffect(() => {
    if (internalRef.current && onHeightChange) {
      // Allow component to render first
      const timeout = setTimeout(() => {
        if (internalRef.current) {
          onHeightChange();
        }
      }, 0);
      
      return () => clearTimeout(timeout);
    }
  }, [value, onHeightChange]);

  // Set ref using callback to ensure we have the most up-to-date ref
  const setTextareaRef = (element: HTMLTextAreaElement) => {
    internalRef.current = element;
    
    // Call forwarded ref if it's a function
    if (typeof forwardedRef === 'function') {
      forwardedRef(element);
    } else if (forwardedRef) {
      forwardedRef.current = element;
    }
  };

  return (
    <Textarea
      ref={setTextareaRef}
      value={value}
      onChange={onChange}
      className={className}
      suppressHydrationWarning
      {...props}
    />
  );
});
