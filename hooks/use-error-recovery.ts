'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { ErrorRecovery, logError } from '@/lib/error-reporting';
import { toast } from '@/components/toast';

export interface UseErrorRecoveryOptions {
  maxRetries?: number;
  baseDelay?: number;
  backoffMultiplier?: number;
  timeout?: number;
  onError?: (error: Error, attempt: number) => void;
  onSuccess?: (attempt: number) => void;
  onMaxRetriesExceeded?: (error: Error) => void;
}

export interface ErrorRecoveryState {
  isLoading: boolean;
  error: Error | null;
  attempt: number;
  canRetry: boolean;
}

export function useErrorRecovery(options: UseErrorRecoveryOptions = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    backoffMultiplier = 2,
    timeout = 10000,
    onError,
    onSuccess,
    onMaxRetriesExceeded,
  } = options;

  const [state, setState] = useState<ErrorRecoveryState>({
    isLoading: false,
    error: null,
    attempt: 0,
    canRetry: true,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName?: string
  ): Promise<T> => {
    let lastError: Error;
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    // Create new abort controller for this operation
    abortControllerRef.current = new AbortController();
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        setState(prev => ({ ...prev, attempt, canRetry: attempt < maxRetries }));

        // Add timeout to operation
        const result = await ErrorRecovery.withTimeout(
          operation,
          timeout,
          `Operation ${operationName || 'unknown'} timed out`
        );

        // Success
        setState({
          isLoading: false,
          error: null,
          attempt,
          canRetry: true,
        });

        onSuccess?.(attempt);
        
        if (attempt > 1) {
          toast({
            type: 'success',
            description: `Recovered after ${attempt} attempts`,
          });
        }

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        setState(prev => ({ 
          ...prev, 
          error: lastError, 
          canRetry: attempt < maxRetries 
        }));

        // Log retry attempt
        await logError(lastError, undefined, {
          type: 'retry_attempt',
          operation: operationName || 'unknown',
          attempt,
          maxRetries,
        });

        onError?.(lastError, attempt);

        // If this was the last attempt, break
        if (attempt === maxRetries) {
          break;
        }

        // Wait before retrying with exponential backoff
        const delay = baseDelay * Math.pow(backoffMultiplier, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));

        // Check if operation was aborted
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Operation aborted');
        }
      }
    }

    // All retries failed
    setState({
      isLoading: false,
      error: lastError!,
      attempt: maxRetries,
      canRetry: false,
    });

    onMaxRetriesExceeded?.(lastError!);
    
    toast({
      type: 'error',
      description: `Failed after ${maxRetries} attempts: ${lastError!.message}`,
    });

    throw lastError!;
  }, [maxRetries, baseDelay, backoffMultiplier, timeout, onError, onSuccess, onMaxRetriesExceeded]);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      attempt: 0,
      canRetry: true,
    });
  }, []);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState(prev => ({ ...prev, isLoading: false }));
  }, []);

  return {
    ...state,
    executeWithRetry,
    reset,
    abort,
  };
}

// Hook for network operations with specific retry logic
export function useNetworkRetry(url?: string) {
  const [networkState, setNetworkState] = useState({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    lastFailedUrl: null as string | null,
  });

  useEffect(() => {
    const handleOnline = () => setNetworkState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setNetworkState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const { executeWithRetry, ...recovery } = useErrorRecovery({
    maxRetries: 5,
    baseDelay: 1000,
    onError: (error, attempt) => {
      if (error.message.includes('fetch') || error.message.includes('network')) {
        setNetworkState(prev => ({ ...prev, lastFailedUrl: url || null }));
      }
    },
  });

  const retryNetworkOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName?: string
  ): Promise<T> => {
    // Wait for network to come back online if offline
    if (!networkState.isOnline) {
      await new Promise<void>((resolve) => {
        const checkOnline = () => {
          if (navigator.onLine) {
            setNetworkState(prev => ({ ...prev, isOnline: true }));
            resolve();
          } else {
            setTimeout(checkOnline, 1000);
          }
        };
        checkOnline();
      });
    }

    return executeWithRetry(operation, operationName);
  }, [networkState.isOnline, executeWithRetry]);

  return {
    ...recovery,
    ...networkState,
    retryNetworkOperation,
  };
}

// Hook for API calls with automatic retry
export function useApiRetry() {
  return useErrorRecovery({
    maxRetries: 3,
    baseDelay: 500,
    timeout: 5000,
    onError: (error, attempt) => {
      // Log specific API errors
      logError(error, undefined, {
        type: 'api_retry',
        attempt,
        errorType: error.name,
      });
    },
  });
}

// Hook for file operations with retry
export function useFileOperationRetry() {
  return useErrorRecovery({
    maxRetries: 2,
    baseDelay: 1000,
    onError: (error, attempt) => {
      if (error.message.includes('quota') || error.message.includes('storage')) {
        toast({
          type: 'warning',
          description: 'Storage quota exceeded. Try clearing browser data.',
        });
      }
    },
  });
}

// Hook for authentication operations
export function useAuthRetry() {
  return useErrorRecovery({
    maxRetries: 2,
    baseDelay: 2000,
    onError: (error, attempt) => {
      if (error.message.includes('rate limit')) {
        toast({
          type: 'warning',
          description: 'Too many login attempts. Please wait before trying again.',
        });
      }
    },
    onMaxRetriesExceeded: (error) => {
      if (error.message.includes('unauthorized') || error.message.includes('credentials')) {
        // Redirect to login after max retries on auth errors
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    },
  });
}

// Hook for chat operations with retry
export function useChatRetry() {
  return useErrorRecovery({
    maxRetries: 3,
    baseDelay: 1500,
    backoffMultiplier: 1.5,
    timeout: 30000, // Longer timeout for chat operations
    onError: (error, attempt) => {
      if (error.message.includes('rate limit')) {
        toast({
          type: 'info',
          description: `Rate limited. Retrying in ${attempt * 1.5}s...`,
        });
      }
    },
  });
}