import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { ApiError } from '@/lib/api-client.types';

interface UseApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  execute: (...args: any[]) => Promise<void>;
}

export function useApi<T>(
  apiFunction: (...args: any[]) => Promise<T>,
  {
    onSuccess,
    onError,
  }: {
    onSuccess?: (data: T) => void;
    onError?: (error: ApiError) => void;
  } = {}
): UseApiResponse<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(false);

  const execute = useCallback(
    async (...args: any[]) => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiFunction(...args);
        setData(result);
        onSuccess?.(result);
      } catch (err: any) {
        const error: ApiError = {
          message: err.message || 'An error occurred',
          status: err.status || 500,
        };
        setError(error);
        onError?.(error);
      } finally {
        setLoading(false);
      }
    },
    [apiFunction, onSuccess, onError]
  );

  return { data, error, loading, execute };
}

// Example usage:
/*
const { data, error, loading, execute } = useApi(apiClient.login, {
  onSuccess: (data) => {
    // Handle successful login
  },
  onError: (error) => {
    // Handle login error
  },
});

// In your component:
const handleLogin = async () => {
  await execute({ email, password });
};
*/ 