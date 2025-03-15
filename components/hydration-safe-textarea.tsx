'use client';

import React, { forwardRef, useEffect, useRef, useState, type ForwardedRef, type TextareaHTMLAttributes } from 'react';
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
  const [clientHydrated, setClientHydrated] = useState(false);
  
  // Mark the component as hydrated after the first render
  useEffect(() => {
    setClientHydrated(true);
  }, []);
  
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

  // We wrap the Textarea in a div to isolate it from Grammarly extensions
  // We omit the className from the wrapper to keep proper styling
  return (
    <div suppressHydrationWarning>
      {/* Only render the textarea client-side if we have issues with hydration */}
      {clientHydrated ? (
        <Textarea
          ref={setTextareaRef}
          value={value}
          onChange={onChange}
          className={className}
          suppressHydrationWarning
          {...props}
        />
      ) : (
        <Textarea
          ref={setTextareaRef}
          className={className}
          suppressHydrationWarning
          {...props}
        />
      )}
    </div>
  );
});
