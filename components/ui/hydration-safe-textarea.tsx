import { forwardRef, TextareaHTMLAttributes, useRef, useEffect } from 'react';

interface HydrationSafeTextareaProps 
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  onValueChange?: (value: string) => void;
}

/**
 * A textarea component that handles hydration safely with browser extensions like Grammarly
 */
const HydrationSafeTextarea = forwardRef<HTMLTextAreaElement, HydrationSafeTextareaProps>(
  ({ className, onValueChange, onChange, ...props }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement | null>(null);
    
    // Use the forwarded ref and internal ref together
    const setRef = (element: HTMLTextAreaElement | null) => {
      internalRef.current = element;
      
      if (typeof ref === 'function') {
        ref(element);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = element;
      }
    };

    // Handle changes from extensions like Grammarly
    useEffect(() => {
      if (!internalRef.current) return;
      
      const element = internalRef.current;
      
      // Use MutationObserver to detect changes to the textarea from extensions
      const observer = new MutationObserver(() => {
        if (element && onValueChange) {
          onValueChange(element.value);
        }
      });
      
      observer.observe(element, {
        attributes: true,
        childList: true,
        subtree: true,
        characterData: true
      });
      
      return () => observer.disconnect();
    }, [onValueChange]);

    // Custom onChange that works with the standard onChange and our onValueChange
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (onChange) {
        onChange(e);
      }
      
      if (onValueChange) {
        onValueChange(e.target.value);
      }
    };

    return (
      <div 
        className={className} 
        // This key attribute helps ensure React re-renders from scratch on client
        suppressHydrationWarning
      >
        <textarea
          ref={setRef}
          onChange={handleChange}
          {...props}
          suppressHydrationWarning
        />
      </div>
    );
  }
);

HydrationSafeTextarea.displayName = 'HydrationSafeTextarea';

export { HydrationSafeTextarea };
