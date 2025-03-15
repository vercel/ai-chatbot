'use client';

import { useEffect, useState, useRef, forwardRef, type ForwardedRef, type ChangeEvent } from 'react';

interface ClientFileInputProps {
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  multiple?: boolean;
  tabIndex?: number;
}

/**
 * A client-only file input component to avoid hydration mismatches
 * caused by browser extensions like Grammarly.
 */
export const ClientFileInput = forwardRef(function ClientFileInput(
  { onChange, multiple = true, tabIndex = -1 }: ClientFileInputProps, 
  ref: ForwardedRef<HTMLInputElement>
) {
  const [isMounted, setIsMounted] = useState(false);
  const internalRef = useRef<HTMLInputElement>(null);
  
  // Only render on client-side to avoid hydration mismatches
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Sync the forwarded ref with our internal ref
  useEffect(() => {
    if (typeof ref === 'function') {
      if (internalRef.current) {
        ref(internalRef.current);
      }
    } else if (ref) {
      ref.current = internalRef.current;
    }
  }, [ref, isMounted]);

  // Don't render anything on server or during hydration
  if (!isMounted) {
    return null;
  }

  return (
    <input
      type="file"
      className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
      ref={internalRef}
      multiple={multiple}
      onChange={onChange}
      tabIndex={tabIndex}
    />
  );
});

export function getFileInputRef() {
  return { current: null } as React.RefObject<HTMLInputElement>;
}
