import { FiveElmsAPIClient } from '@FiveElmsCapital/five-elms-ts-sdk';

// Environment configuration
const API_CONFIG = {
  baseUrl: process.env.FIVE_ELMS_API_BASE_URL,
  token: process.env.FIVE_ELMS_API_TOKEN,
  timeout: 30000, // 30 seconds
} as const;

// Error types
export class FiveElmsAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'FiveElmsAPIError';
  }
}

export class CompanyNotFoundError extends FiveElmsAPIError {
  constructor(domain: string) {
    super(`Company not found for domain: ${domain}`, 404, 'COMPANY_NOT_FOUND');
    this.name = 'CompanyNotFoundError';
  }
}

export class ConfigurationError extends FiveElmsAPIError {
  constructor(message: string) {
    super(message, 500, 'CONFIGURATION_ERROR');
    this.name = 'ConfigurationError';
  }
}

// Create a singleton instance
class FiveElmsClientSingleton {
  private static instance: FiveElmsAPIClient;

  public static getInstance(): FiveElmsAPIClient {
    if (!FiveElmsClientSingleton.instance) {
      if (!API_CONFIG.token) {
        throw new ConfigurationError('Five Elms API token is not configured');
      }

      if (!API_CONFIG.baseUrl) {
        throw new ConfigurationError('Five Elms API base URL is not configured');
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

  if (error instanceof FiveElmsAPIError) {
    return error;
  }

  // Handle specific error cases
  if (error instanceof Error) {
    if (error.message.includes('404') || error.message.toLowerCase().includes('not found')) {
      return new CompanyNotFoundError(error.message);
    }
  }
  
  // Log unexpected errors
  console.error('Unexpected Five Elms API error:', {
    error: safeStringify(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  
  return new FiveElmsAPIError(
    'An unexpected error occurred while accessing Five Elms API',
    500,
    'UNEXPECTED_ERROR',
    error
  );
}

// Export a function to get the client instance
export function getFiveElmsClient() {
  return FiveElmsClientSingleton.getInstance();
} 