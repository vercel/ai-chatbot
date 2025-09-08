'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, 
  RefreshCw, 
  Home, 
  MessageSquare, 
  Code, 
  User, 
  Wifi,
  Shield,
  Clock,
  Bug,
  Zap,
  AlertTriangle
} from 'lucide-react';
import type { ErrorFallbackProps } from './error-boundary';

// Chat-specific error fallback
export const ChatErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  retryCount,
  maxRetries,
  showErrorDetails,
  errorId,
}) => {
  const canRetry = retryCount < maxRetries;

  const getChatErrorType = () => {
    if (error?.message.includes('network') || error?.message.includes('fetch')) {
      return 'network';
    }
    if (error?.message.includes('rate') || error?.message.includes('limit')) {
      return 'rate_limit';
    }
    if (error?.message.includes('auth') || error?.message.includes('unauthorized')) {
      return 'auth';
    }
    return 'unknown';
  };

  const errorType = getChatErrorType();

  const getErrorContent = () => {
    switch (errorType) {
      case 'network':
        return {
          icon: <Wifi className="w-8 h-8 text-orange-500" />,
          title: 'Connection Issue',
          message: 'Unable to connect to the chat service. Please check your internet connection and try again.',
        };
      case 'rate_limit':
        return {
          icon: <Clock className="w-8 h-8 text-yellow-500" />,
          title: 'Rate Limit Reached',
          message: 'Too many messages sent. Please wait a moment before sending another message.',
        };
      case 'auth':
        return {
          icon: <Shield className="w-8 h-8 text-red-500" />,
          title: 'Authentication Error',
          message: 'Your session has expired. Please sign in again to continue chatting.',
        };
      default:
        return {
          icon: <MessageSquare className="w-8 h-8 text-gray-500" />,
          title: 'Chat Error',
          message: 'An error occurred while processing your message. Please try sending it again.',
        };
    }
  };

  const { icon, title, message } = getErrorContent();

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-background border border-border rounded-lg max-w-md mx-auto">
      {icon}
      
      <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">
        {title}
      </h3>
      
      <p className="text-muted-foreground text-center mb-6">
        {message}
      </p>

      <div className="flex gap-3 w-full">
        {canRetry && (
          <Button onClick={resetError} className="flex-1 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Retry {retryCount > 0 && `(${retryCount}/${maxRetries})`}
          </Button>
        )}
        
        {errorType === 'auth' && (
          <Button
            onClick={() => window.location.href = '/login'}
            variant="outline"
            className="flex-1"
          >
            Sign In
          </Button>
        )}
      </div>

      {showErrorDetails && error && (
        <details className="mt-4 w-full">
          <summary className="cursor-pointer text-sm text-muted-foreground">
            Technical Details
          </summary>
          <div className="mt-2 p-3 bg-muted rounded text-xs font-mono overflow-auto max-h-32">
            {error.message}
            {errorId && (
              <div className="mt-2 text-muted-foreground">
                Error ID: {errorId}
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
};

// Artifact-specific error fallback
export const ArtifactErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  retryCount,
  maxRetries,
  showErrorDetails,
}) => {
  const canRetry = retryCount < maxRetries;

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-muted/50 border border-border rounded-lg min-h-[200px]">
      <Code className="w-10 h-10 text-orange-500 mb-4" />
      
      <h3 className="text-xl font-semibold text-foreground mb-2">
        Artifact Error
      </h3>
      
      <p className="text-muted-foreground text-center mb-6 max-w-sm">
        This artifact encountered an error and cannot be displayed. The rest of the chat should continue to work normally.
      </p>

      <div className="flex gap-3">
        {canRetry && (
          <Button onClick={resetError} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Reload Artifact
          </Button>
        )}
        
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Page
        </Button>
      </div>

      {showErrorDetails && error && (
        <details className="mt-6 w-full max-w-lg">
          <summary className="cursor-pointer text-sm text-muted-foreground">
            Show Error Details
          </summary>
          <div className="mt-2 p-3 bg-background rounded text-xs font-mono whitespace-pre-wrap overflow-auto max-h-40">
            {error.message}
            {error.stack && (
              <>
                {'\n\n'}
                {error.stack}
              </>
            )}
          </div>
        </details>
      )}
    </div>
  );
};

// Auth-specific error fallback
export const AuthErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  retryCount,
  maxRetries,
  showErrorDetails,
}) => {
  const canRetry = retryCount < maxRetries;

  const getAuthErrorType = () => {
    if (error?.message.includes('network') || error?.message.includes('fetch')) {
      return 'network';
    }
    if (error?.message.includes('credentials') || error?.message.includes('invalid')) {
      return 'credentials';
    }
    if (error?.message.includes('expired') || error?.message.includes('session')) {
      return 'session';
    }
    return 'unknown';
  };

  const errorType = getAuthErrorType();

  const getErrorContent = () => {
    switch (errorType) {
      case 'network':
        return {
          icon: <Wifi className="w-8 h-8 text-orange-500" />,
          title: 'Connection Failed',
          message: 'Unable to connect to authentication service. Please check your internet connection.',
          action: 'Retry',
        };
      case 'credentials':
        return {
          icon: <Shield className="w-8 h-8 text-red-500" />,
          title: 'Invalid Credentials',
          message: 'The provided credentials are incorrect. Please check your email and password.',
          action: 'Try Again',
        };
      case 'session':
        return {
          icon: <Clock className="w-8 h-8 text-yellow-500" />,
          title: 'Session Expired',
          message: 'Your session has expired for security reasons. Please sign in again.',
          action: 'Sign In Again',
        };
      default:
        return {
          icon: <User className="w-8 h-8 text-gray-500" />,
          title: 'Authentication Error',
          message: 'An error occurred during authentication. Please try again.',
          action: 'Retry',
        };
    }
  };

  const { icon, title, message, action } = getErrorContent();

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-background border border-border rounded-lg max-w-md mx-auto">
      {icon}
      
      <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">
        {title}
      </h3>
      
      <p className="text-muted-foreground text-center mb-6">
        {message}
      </p>

      <div className="flex flex-col gap-3 w-full">
        {canRetry && (
          <Button onClick={resetError} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            {action} {retryCount > 0 && `(${retryCount}/${maxRetries})`}
          </Button>
        )}
        
        <Button
          variant="outline"
          onClick={() => window.location.href = '/'}
          className="flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          Go Home
        </Button>
      </div>

      {showErrorDetails && error && (
        <details className="mt-4 w-full">
          <summary className="cursor-pointer text-sm text-muted-foreground">
            Show Error Details
          </summary>
          <div className="mt-2 p-3 bg-muted rounded text-xs font-mono overflow-auto max-h-32">
            {error.message}
          </div>
        </details>
      )}
    </div>
  );
};

// Network error fallback (for API calls, data fetching)
export const NetworkErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  retryCount,
  maxRetries,
}) => {
  const canRetry = retryCount < maxRetries;

  return (
    <div className="flex items-center justify-center p-4 bg-orange-50 border border-orange-200 rounded-lg">
      <div className="flex items-center gap-3">
        <Wifi className="w-5 h-5 text-orange-500" />
        <div className="flex-1">
          <p className="text-sm font-medium text-orange-800">Connection Issue</p>
          <p className="text-xs text-orange-600">
            {error?.message || 'Unable to load data. Check your internet connection.'}
          </p>
        </div>
        {canRetry && (
          <Button size="sm" variant="ghost" onClick={resetError}>
            <RefreshCw className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
};

// Critical error fallback (for system-level failures)
export const CriticalErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  showErrorDetails,
  errorId,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-lg w-full text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
        
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Critical Error
        </h1>
        
        <p className="text-muted-foreground mb-8">
          A critical system error occurred. The application may not function properly until this is resolved.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button onClick={resetError} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reload Page
          </Button>
        </div>

        {showErrorDetails && error && (
          <div className="text-left">
            <h3 className="text-lg font-semibold mb-3">Error Details</h3>
            <div className="p-4 bg-muted rounded-lg text-sm font-mono whitespace-pre-wrap overflow-auto max-h-60">
              {error.message}
              {error.stack && (
                <>
                  {'\n\n'}
                  {error.stack}
                </>
              )}
              {errorId && (
                <>
                  {'\n\n'}
                  Error ID: {errorId}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Loading error fallback (for suspense boundaries)
export const LoadingErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  retryCount,
  maxRetries,
}) => {
  const canRetry = retryCount < maxRetries;

  return (
    <div className="flex items-center justify-center p-6 bg-background">
      <div className="flex flex-col items-center gap-4">
        <Zap className="w-8 h-8 text-yellow-500 animate-pulse" />
        <div className="text-center">
          <p className="font-medium text-foreground">Loading Failed</p>
          <p className="text-sm text-muted-foreground">
            {error?.message || 'Unable to load content'}
          </p>
        </div>
        {canRetry && (
          <Button size="sm" onClick={resetError} className="flex items-center gap-2">
            <RefreshCw className="w-3 h-3" />
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
};

// Inline error fallback (for small components)
export const InlineErrorFallback: React.FC<ErrorFallbackProps> = ({
  resetError,
  retryCount,
  maxRetries,
}) => {
  const canRetry = retryCount < maxRetries;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-200 rounded text-sm">
      <Bug className="w-3 h-3 text-red-500" />
      <span className="text-red-700">Error</span>
      {canRetry && (
        <button
          onClick={resetError}
          className="text-red-600 hover:text-red-800 underline"
        >
          retry
        </button>
      )}
    </div>
  );
};