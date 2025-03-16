'use client';

import { useState, useEffect } from 'react';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';
import { useToast } from '@/components/ui/use-toast';

export function Toaster() {
  const { toasts } = useToast();

  // Simplified implementation - just use an empty array if there are issues
  const validToasts = Array.isArray(toasts) ? toasts : [];

  return (
    <ToastProvider>
      {validToasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id || Math.random()} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}