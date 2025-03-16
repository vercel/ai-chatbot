'use client';

import * as React from 'react';

// Define the toast interface
export interface Toast {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: 'default' | 'destructive';
}

// Create a simple context for toast state
type ToastContextType = {
  toasts: Toast[];
  toast: (props: Omit<Toast, 'id'>) => { id: string };
  dismiss: (id?: string) => void;
};

const ToastContext = React.createContext<ToastContextType>({
  toasts: [],
  toast: () => ({ id: '' }),
  dismiss: () => {},
});

// Create a toast ID
let toastCount = 0;
function generateToastId() {
  return `toast-${++toastCount}`;
}

// Simplified toast function
export function toast(props: Omit<Toast, 'id'>) {
  const id = generateToastId();
  const toastFn = window['__TOAST_FN__'];
  
  if (typeof toastFn === 'function') {
    toastFn({
      ...props,
      id,
    });
  } else {
    console.warn('Toast system not properly initialized');
  }
  
  return {
    id,
    dismiss: () => {},
    update: () => {},
  };
}

// Simplified toast provider hook
export function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  
  // Create a toast function that adds to the state
  const addToast = React.useCallback((props: Omit<Toast, 'id'>) => {
    const id = generateToastId();
    const newToast: Toast = {
      ...props,
      id,
      open: true,
    };
    
    setToasts((prev) => [...prev, newToast]);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
    
    return { id };
  }, []);
  
  // Expose the toast function globally for direct use
  React.useEffect(() => {
    window['__TOAST_FN__'] = addToast;
    return () => {
      delete window['__TOAST_FN__'];
    };
  }, [addToast]);
  
  // Dismiss a toast
  const dismiss = React.useCallback((id?: string) => {
    setToasts((prev) => 
      id 
        ? prev.filter((t) => t.id !== id)
        : []
    );
  }, []);
  
  return {
    toasts,
    toast: addToast,
    dismiss,
  };
}