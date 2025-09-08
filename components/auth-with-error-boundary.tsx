'use client';

import React from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import { AuthErrorFallback, NetworkErrorFallback } from '@/components/error-fallbacks';
import { AuthForm } from './auth-form';
import { logError, ErrorRecovery, NetworkError, AuthenticationError } from '@/lib/error-reporting';

interface AuthWithErrorBoundaryProps {
  action: NonNullable<
    string | ((formData: FormData) => void | Promise<void>) | undefined
  >;
  children: React.ReactNode;
  defaultEmail?: string;
  formType?: 'login' | 'register' | 'reset';
}

export function AuthWithErrorBoundary({
  action,
  children,
  defaultEmail = '',
  formType = 'login',
}: AuthWithErrorBoundaryProps) {
  const handleAuthError = React.useCallback((error: Error, errorInfo: React.ErrorInfo, errorId: string) => {
    logError(error, errorInfo, {
      component: 'AuthForm',
      formType,
      hasDefaultEmail: !!defaultEmail,
      errorType: error.name,
      errorId,
    });
  }, [formType, defaultEmail]);

  return (
    <ErrorBoundary
      fallback={AuthErrorFallback}
      onError={handleAuthError}
      level="component"
      maxRetries={3}
      resetKeys={[formType, defaultEmail]}
    >
      <AuthForm action={action} defaultEmail={defaultEmail}>
        {children}
      </AuthForm>
    </ErrorBoundary>
  );
}

// Enhanced auth form with network error handling
export function EnhancedAuthForm({
  action,
  children,
  defaultEmail = '',
  formType = 'login',
}: AuthWithErrorBoundaryProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = React.useCallback(async (formData: FormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await ErrorRecovery.withRetry(async () => {
        if (typeof action === 'string') {
          // Handle form action URL
          const response = await fetch(action, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            
            if (response.status === 401) {
              throw new AuthenticationError(errorData.message || 'Invalid credentials');
            } else if (response.status >= 500) {
              throw new NetworkError('Server error occurred', response.status, action);
            } else {
              throw new Error(errorData.message || 'Authentication failed');
            }
          }

          // Handle successful response
          const result = await response.json().catch(() => ({}));
          if (result.redirectTo) {
            window.location.href = result.redirectTo;
          }
        } else {
          // Handle function action
          await action(formData);
        }
      }, 2, 1000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setError(errorMessage);
      
      // Log auth error
      logError(
        error instanceof Error ? error : new Error(errorMessage),
        undefined,
        {
          component: 'EnhancedAuthForm',
          formType,
          errorType: error instanceof Error ? error.name : 'UnknownError',
        }
      );
    } finally {
      setIsLoading(false);
    }
  }, [action, formType]);

  return (
    <ErrorBoundary
      fallback={AuthErrorFallback}
      level="component"
      maxRetries={2}
    >
      <form action={handleSubmit} className="flex flex-col gap-4 px-4 sm:px-16">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-red-600 text-xs underline hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        )}
        
        <AuthFormFields defaultEmail={defaultEmail} />
        
        <div className="flex flex-col gap-2">
          {React.Children.map(children, child => {
            if (React.isValidElement(child) && child.type === 'button') {
              return React.cloneElement(child as React.ReactElement<any>, {
                disabled: isLoading,
                children: isLoading ? 'Please wait...' : child.props.children,
              });
            }
            return child;
          })}
        </div>
      </form>
    </ErrorBoundary>
  );
}

// Auth form fields with individual error boundaries
function AuthFormFields({ defaultEmail }: { defaultEmail: string }) {
  return (
    <>
      <ErrorBoundary
        fallback={({ resetError }) => (
          <div className="flex flex-col gap-2">
            <label className="text-zinc-600 font-normal dark:text-zinc-400">
              Email Address
            </label>
            <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              Email field error
              <button onClick={resetError} className="ml-2 underline">retry</button>
            </div>
          </div>
        )}
        level="component"
        maxRetries={1}
      >
        <EmailField defaultEmail={defaultEmail} />
      </ErrorBoundary>

      <ErrorBoundary
        fallback={({ resetError }) => (
          <div className="flex flex-col gap-2">
            <label className="text-zinc-600 font-normal dark:text-zinc-400">
              Password
            </label>
            <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              Password field error
              <button onClick={resetError} className="ml-2 underline">retry</button>
            </div>
          </div>
        )}
        level="component"
        maxRetries={1}
      >
        <PasswordField />
      </ErrorBoundary>
    </>
  );
}

function EmailField({ defaultEmail }: { defaultEmail: string }) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor="email"
        className="text-zinc-600 font-normal dark:text-zinc-400"
      >
        Email Address
      </label>
      <input
        id="email"
        name="email"
        className="bg-muted text-md md:text-sm px-3 py-2 border border-input rounded-md"
        type="email"
        placeholder="user@acme.com"
        autoComplete="email"
        required
        autoFocus
        defaultValue={defaultEmail}
      />
    </div>
  );
}

function PasswordField() {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor="password"
        className="text-zinc-600 font-normal dark:text-zinc-400"
      >
        Password
      </label>
      <input
        id="password"
        name="password"
        className="bg-muted text-md md:text-sm px-3 py-2 border border-input rounded-md"
        type="password"
        required
        autoComplete="current-password"
      />
    </div>
  );
}

// Session error boundary
export function SessionErrorBoundary({ children }: { children: React.ReactNode }) {
  const handleSessionError = React.useCallback((error: Error, errorInfo: React.ErrorInfo, errorId: string) => {
    logError(error, errorInfo, {
      component: 'Session',
      errorType: 'session_error',
      errorId,
    });
  }, []);

  return (
    <ErrorBoundary
      fallback={({ resetError }) => (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-center">
            <p className="text-yellow-800 font-medium mb-2">Session Error</p>
            <p className="text-yellow-600 text-sm mb-3">
              There was a problem with your session
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={resetError}
                className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
              >
                Retry
              </button>
              <button
                onClick={() => window.location.href = '/login'}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}
      onError={handleSessionError}
      level="component"
      maxRetries={2}
    >
      {children}
    </ErrorBoundary>
  );
}

// Auth provider error boundary
export function AuthProviderErrorBoundary({ children }: { children: React.ReactNode }) {
  const handleProviderError = React.useCallback((error: Error, errorInfo: React.ErrorInfo, errorId: string) => {
    logError(error, errorInfo, {
      component: 'AuthProvider',
      errorType: 'auth_provider_error',
      errorId,
    });
  }, []);

  return (
    <ErrorBoundary
      fallback={({ resetError }) => (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Authentication Service Unavailable
            </h2>
            <p className="text-muted-foreground mb-6">
              The authentication service is currently unavailable. Please try again later.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={resetError}
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      )}
      onError={handleProviderError}
      level="critical"
      maxRetries={3}
    >
      {children}
    </ErrorBoundary>
  );
}