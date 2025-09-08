'use client';

import React, { ErrorInfo, ReactNode, Component } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home, Bug } from 'lucide-react';
import { toast } from '@/components/toast';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  maxRetries?: number;
  showErrorDetails?: boolean;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
  isolate?: boolean;
  level?: 'page' | 'component' | 'critical';
}

interface ErrorFallbackProps {
  error?: Error;
  errorInfo?: ErrorInfo;
  resetError: () => void;
  retryCount: number;
  maxRetries: number;
  level: 'page' | 'component' | 'critical';
  showErrorDetails: boolean;
  errorId?: string;
}

// Error logging utility
const logError = async (error: Error, errorInfo: ErrorInfo, errorId: string, level: string) => {
  try {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Boundary [${level.toUpperCase()}] - ${errorId}`);
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }

    // Send to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // You can integrate with services like Sentry, LogRocket, etc.
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          errorId,
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          level,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      }).catch((reportError) => {
        console.error('Failed to report error:', reportError);
      });
    }
  } catch (logError) {
    console.error('Error in error logging:', logError);
  }
};

// Generate unique error ID
const generateErrorId = (): string => {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Default error fallback components
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  retryCount,
  maxRetries,
  level,
  showErrorDetails,
  errorId,
}) => {
  const canRetry = retryCount < maxRetries;

  const getErrorTitle = () => {
    switch (level) {
      case 'critical':
        return 'Critical System Error';
      case 'page':
        return 'Page Error';
      case 'component':
        return 'Component Error';
      default:
        return 'Something went wrong';
    }
  };

  const getErrorMessage = () => {
    switch (level) {
      case 'critical':
        return 'A critical error occurred that affected the entire application. Please refresh the page or contact support if the problem persists.';
      case 'page':
        return 'This page encountered an error and cannot be displayed properly. You can try refreshing or navigate to the home page.';
      case 'component':
        return 'A component on this page encountered an error. The rest of the page should continue to work normally.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  };

  const handleReportError = () => {
    if (errorId) {
      toast({
        type: 'info',
        description: `Error reported with ID: ${errorId}`,
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-background border border-destructive/20 rounded-lg">
      <div className="flex flex-col items-center text-center max-w-md">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        
        <h2 className="text-xl font-semibold text-foreground mb-2">
          {getErrorTitle()}
        </h2>
        
        <p className="text-muted-foreground mb-6">
          {getErrorMessage()}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          {canRetry && (
            <Button
              onClick={resetError}
              className="flex items-center gap-2"
              variant="default"
            >
              <RefreshCw className="w-4 h-4" />
              Retry {retryCount > 0 && `(${retryCount}/${maxRetries})`}
            </Button>
          )}
          
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Button>
        </div>

        {showErrorDetails && error && (
          <details className="mt-4 w-full">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              Show Error Details
            </summary>
            <div className="mt-2 p-3 bg-muted rounded text-xs text-left font-mono whitespace-pre-wrap overflow-auto max-h-40">
              {error.message}
              {error.stack && (
                <>
                  {'\n\n'}
                  {error.stack}
                </>
              )}
            </div>
            <Button
              onClick={handleReportError}
              variant="ghost"
              size="sm"
              className="mt-2 flex items-center gap-2 text-xs"
            >
              <Bug className="w-3 h-3" />
              Report Error
            </Button>
          </details>
        )}
      </div>
    </div>
  );
};

// Minimal error fallback for critical components
const MinimalErrorFallback: React.FC<ErrorFallbackProps> = ({
  resetError,
  retryCount,
  maxRetries,
}) => {
  const canRetry = retryCount < maxRetries;

  return (
    <div className="flex items-center justify-center p-4 bg-destructive/10 border border-destructive/20 rounded">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-destructive" />
        <span className="text-sm text-muted-foreground">Error occurred</span>
        {canRetry && (
          <Button size="sm" variant="ghost" onClick={resetError}>
            <RefreshCw className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
};

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = generateErrorId();
    const level = this.props.level || 'component';

    this.setState({
      error,
      errorInfo,
      errorId,
    });

    // Log error
    logError(error, errorInfo, errorId, level);

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorId);
    }

    // Show toast notification for non-critical errors
    if (level !== 'critical') {
      toast({
        type: 'error',
        description: `An error occurred: ${error.message}`,
      });
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    if (hasError && prevProps.children !== this.props.children) {
      if (resetOnPropsChange) {
        this.resetError();
        return;
      }

      if (resetKeys) {
        const prevResetKeys = prevProps.resetKeys || [];
        if (
          resetKeys.length !== prevResetKeys.length ||
          resetKeys.some((key, index) => key !== prevResetKeys[index])
        ) {
          this.resetError();
        }
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetError = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      toast({
        type: 'error',
        description: 'Maximum retry attempts reached. Please refresh the page.',
      });
      return;
    }

    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: undefined,
      retryCount: prevState.retryCount + 1,
    }));
  };

  render() {
    const {
      children,
      fallback: CustomFallback,
      maxRetries = 3,
      showErrorDetails = process.env.NODE_ENV === 'development',
      level = 'component',
    } = this.props;

    if (this.state.hasError) {
      const errorFallbackProps: ErrorFallbackProps = {
        error: this.state.error,
        errorInfo: this.state.errorInfo,
        resetError: this.resetError,
        retryCount: this.state.retryCount,
        maxRetries,
        level,
        showErrorDetails,
        errorId: this.state.errorId,
      };

      if (CustomFallback) {
        return <CustomFallback {...errorFallbackProps} />;
      }

      // Use minimal fallback for component-level errors
      if (level === 'component') {
        return <MinimalErrorFallback {...errorFallbackProps} />;
      }

      return <DefaultErrorFallback {...errorFallbackProps} />;
    }

    return children;
  }
}

// Higher-order component for easy error boundary wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Hook for manually triggering error boundaries (useful for async errors)
export function useErrorHandler() {
  return React.useCallback((error: Error) => {
    // Re-throw error to trigger error boundary
    setTimeout(() => {
      throw error;
    }, 0);
  }, []);
}

export { ErrorBoundary };
export type { ErrorBoundaryProps, ErrorFallbackProps };