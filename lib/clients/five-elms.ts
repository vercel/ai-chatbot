import { FiveElmsAPIClient } from '@FiveElmsCapital/five-elms-ts-sdk';

// Environment configuration
const API_CONFIG = {
  baseUrl: process.env.FIVE_ELMS_API_BASE_URL,
  token: process.env.FIVE_ELMS_API_TOKEN,
  timeout: 30000, // 30 seconds
} as const;

// Create a singleton instance
class FiveElmsClientSingleton {
  private static instance: FiveElmsAPIClient;

  public static getInstance(): FiveElmsAPIClient {
    if (!FiveElmsClientSingleton.instance) {
      if (!API_CONFIG.token) {
        console.error('Five Elms API Configuration Error: Missing API token');
        throw new Error('Five Elms API token is not configured');
      }

      if (!API_CONFIG.baseUrl) {
        console.error('Five Elms API Configuration Error: Missing base URL');
        throw new Error('Five Elms API base URL is not configured');
      }

      console.log('Five Elms API Client Configuration:', {
        baseUrl: API_CONFIG.baseUrl,
        timeout: API_CONFIG.timeout,
        // Don't log the full token for security
        tokenProvided: !!API_CONFIG.token,
      });

      FiveElmsClientSingleton.instance = new FiveElmsAPIClient({
        baseUrl: API_CONFIG.baseUrl,
        token: API_CONFIG.token,
        timeout: API_CONFIG.timeout,
      });
    }
    return FiveElmsClientSingleton.instance;
  }
}

// Error handling types and utilities
export interface FiveElmsAPIError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

export function isFiveElmsAPIError(error: unknown): error is FiveElmsAPIError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error
  );
}

// Helper function to safely stringify objects for logging
function safeStringify(obj: unknown): string {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (error) {
    return `[Unable to stringify: ${error}]`;
  }
}

// Helper function to handle API errors
export async function handleFiveElmsAPIError(error: unknown): Promise<FiveElmsAPIError> {
  console.error('Five Elms API Error:', {
    error: safeStringify(error),
    stack: error instanceof Error ? error.stack : undefined,
    type: error?.constructor?.name,
  });

  if (isFiveElmsAPIError(error)) {
    return {
      ...error,
      details: error,
    };
  }
  
  // Log unexpected errors
  console.error('Unexpected Five Elms API error:', {
    error: safeStringify(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  
  return {
    message: 'An unexpected error occurred while accessing Five Elms API',
    status: 500,
    details: error,
  };
}

// Export a function to get the client instance
export function getFiveElmsClient() {
  return FiveElmsClientSingleton.getInstance();
} 