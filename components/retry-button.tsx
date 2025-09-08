'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useErrorRecovery } from '@/hooks/use-error-recovery';

interface RetryButtonProps {
  onRetry: () => Promise<void>;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  maxRetries?: number;
  operationName?: string;
  showProgress?: boolean;
}

export function RetryButton({
  onRetry,
  disabled = false,
  children = 'Retry',
  className,
  variant = 'default',
  size = 'default',
  maxRetries = 3,
  operationName = 'operation',
  showProgress = true,
}: RetryButtonProps) {
  const { executeWithRetry, isLoading, error, attempt, canRetry } = useErrorRecovery({
    maxRetries,
    onError: (error, attempt) => {
      console.log(`Retry ${attempt}/${maxRetries} failed:`, error.message);
    },
    onSuccess: (attempt) => {
      if (attempt > 1) {
        console.log(`${operationName} succeeded after ${attempt} attempts`);
      }
    },
  });

  const handleClick = async () => {
    try {
      await executeWithRetry(onRetry, operationName);
    } catch (error) {
      // Error handling is managed by the hook
    }
  };

  const getButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {showProgress && attempt > 0 && (
            <span>Retry {attempt}/{maxRetries}</span>
          )}
          {!showProgress && <span>Retrying...</span>}
        </>
      );
    }

    if (error && !canRetry) {
      return (
        <>
          <AlertCircle className="w-4 h-4" />
          <span>Failed</span>
        </>
      );
    }

    if (error && canRetry) {
      return (
        <>
          <RefreshCw className="w-4 h-4" />
          <span>Retry {showProgress ? `(${attempt}/${maxRetries})` : ''}</span>
        </>
      );
    }

    return (
      <>
        <RefreshCw className="w-4 h-4" />
        <span>{children}</span>
      </>
    );
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || isLoading || (error && !canRetry)}
      className={cn(
        'flex items-center gap-2',
        error && !canRetry && 'opacity-50 cursor-not-allowed',
        className
      )}
      variant={error && !canRetry ? 'destructive' : variant}
      size={size}
    >
      {getButtonContent()}
    </Button>
  );
}

// Smart retry button that adapts based on error type
export function SmartRetryButton({
  onRetry,
  error,
  disabled = false,
  className,
}: {
  onRetry: () => Promise<void>;
  error?: Error | null;
  disabled?: boolean;
  className?: string;
}) {
  const getRetryConfig = (error?: Error | null) => {
    if (!error) {
      return { maxRetries: 3, operationName: 'operation' };
    }

    // Network errors get more retries
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return { maxRetries: 5, operationName: 'network request' };
    }

    // Rate limit errors get fewer retries with longer delays
    if (error.message.includes('rate limit')) {
      return { maxRetries: 2, operationName: 'rate limited operation' };
    }

    // Auth errors get minimal retries
    if (error.message.includes('auth') || error.message.includes('unauthorized')) {
      return { maxRetries: 1, operationName: 'authentication' };
    }

    return { maxRetries: 3, operationName: 'operation' };
  };

  const config = getRetryConfig(error);

  return (
    <RetryButton
      onRetry={onRetry}
      disabled={disabled}
      className={className}
      maxRetries={config.maxRetries}
      operationName={config.operationName}
    />
  );
}

// Retry section component with progress indicator
export function RetrySection({
  onRetry,
  error,
  title = 'Something went wrong',
  description,
  maxRetries = 3,
  className,
}: {
  onRetry: () => Promise<void>;
  error?: Error | null;
  title?: string;
  description?: string;
  maxRetries?: number;
  className?: string;
}) {
  const { executeWithRetry, isLoading, attempt, canRetry, error: retryError } = useErrorRecovery({
    maxRetries,
  });

  const handleRetry = async () => {
    try {
      await executeWithRetry(onRetry);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const displayError = retryError || error;

  return (
    <div className={cn(
      'flex flex-col items-center justify-center p-6 bg-background border border-border rounded-lg',
      className
    )}>
      <div className="flex items-center gap-2 mb-4">
        {displayError && <AlertCircle className="w-5 h-5 text-destructive" />}
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>

      {description && (
        <p className="text-muted-foreground text-center mb-4 max-w-md">
          {description}
        </p>
      )}

      {displayError && (
        <p className="text-sm text-destructive text-center mb-6">
          {displayError.message}
        </p>
      )}

      {isLoading && attempt > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Attempt {attempt} of {maxRetries}</span>
          </div>
        </div>
      )}

      <RetryButton
        onRetry={handleRetry}
        maxRetries={maxRetries}
        disabled={!canRetry && !displayError}
      />
    </div>
  );
}

// Auto retry component that retries automatically
export function AutoRetryWrapper({
  children,
  onRetry,
  retryInterval = 5000,
  maxAutoRetries = 3,
  error,
}: {
  children: React.ReactNode;
  onRetry: () => Promise<void>;
  retryInterval?: number;
  maxAutoRetries?: number;
  error?: Error | null;
}) {
  const [autoRetryCount, setAutoRetryCount] = React.useState(0);
  const [isAutoRetrying, setIsAutoRetrying] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  React.useEffect(() => {
    if (error && autoRetryCount < maxAutoRetries) {
      setIsAutoRetrying(true);
      timeoutRef.current = setTimeout(async () => {
        try {
          await onRetry();
          setAutoRetryCount(0);
        } catch {
          setAutoRetryCount(prev => prev + 1);
        } finally {
          setIsAutoRetrying(false);
        }
      }, retryInterval);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [error, autoRetryCount, maxAutoRetries, onRetry, retryInterval]);

  if (error) {
    return (
      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="font-medium text-orange-800">Connection Lost</p>
            <p className="text-sm text-orange-600">
              {isAutoRetrying ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Reconnecting... (attempt {autoRetryCount + 1}/{maxAutoRetries})
                </span>
              ) : autoRetryCount >= maxAutoRetries ? (
                'Auto-retry limit reached'
              ) : (
                `Retrying in ${Math.ceil(retryInterval / 1000)}s...`
              )}
            </p>
          </div>
          {autoRetryCount >= maxAutoRetries && (
            <RetryButton
              onRetry={async () => {
                setAutoRetryCount(0);
                await onRetry();
              }}
              size="sm"
            >
              Manual Retry
            </RetryButton>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}