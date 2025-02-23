import { tool } from 'ai';
import { z } from 'zod';
import { getFiveElmsClient, handleFiveElmsAPIError, CompanyNotFoundError } from '@/lib/clients/five-elms';
import { CompanyResponse } from '@FiveElmsCapital/five-elms-ts-sdk';

// Helper function to safely stringify objects for logging
function safeStringify(obj: unknown): string {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (error) {
    return `[Unable to stringify: ${error}]`;
  }
}

interface GetCompanyProfileResult {
  profile: CompanyResponse | null;
  summary: string;
}

// Helper function to validate company profile data
function isValidCompanyProfile(profile: unknown): profile is CompanyResponse {
  return (
    profile !== null &&
    typeof profile === 'object' &&
    'company' in profile &&
    typeof (profile as any).company === 'string'
  );
}

export const getCompanyProfile = tool({
  description: `Get company profile from Five Elms database. 
    USE WHEN: User asks about specific companies in context of:
    - Verifying if company is in our database
    - Checking our relationship/interaction history
    - Inquiring about funding or growth metrics
    - Needing contact information
    Note: Let the UI component handle detailed data display. Focus on answering the specific context of the user's question.`,
  parameters: z.object({
    domain: z.string().describe('The company domain to look up (e.g., "example.com")'),
  }),
  execute: async ({ domain }): Promise<GetCompanyProfileResult> => {
    console.log('Fetching company profile for domain:', domain);

    try {
      const client = getFiveElmsClient();
      console.log('Making API request to Five Elms for domain:', domain);
      
      const response = await client.getCompanyProfile(domain);
      
      // Handle empty response cases
      if (!response) {
        console.log('No company found for domain:', domain);
        return {
          profile: null,
          summary: `No company profile found for domain: ${domain}`
        };
      }

      // The API returns an array, get the first item
      const profile = Array.isArray(response) ? response[0] : response;

      // Validate the profile data
      if (!isValidCompanyProfile(profile)) {
        console.warn('Invalid company profile data:', safeStringify(profile));
        return {
          profile: null,
          summary: `Unable to retrieve valid company data for domain: ${domain}`
        };
      }

      console.log('Received API response:', {
        company: profile.company,
        website: profile.website,
        responseData: safeStringify(profile),
      });
      
      // Format the response to include both the profile data and a summary
      const result = {
        profile,
        summary: `Found company profile for ${profile.company}. Founded in ${profile.year_founded}, currently has ${profile.staff_size} employees${profile.company_description ? `. ${profile.company_description}` : ''}`
      };

      console.log('Formatted tool response:', {
        company: result.profile.company,
        summary: result.summary,
        fullResponse: safeStringify(result),
      });

      return result;
    } catch (error) {
      console.error('Error in getCompanyProfile tool:', {
        domain,
        error: safeStringify(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Handle known error cases
      if (error instanceof CompanyNotFoundError) {
        return {
          profile: null,
          summary: `No company profile found for domain: ${domain}`
        };
      }

      // For other errors, let the error handler process it
      const apiError = await handleFiveElmsAPIError(error);
      
      // Return a graceful response instead of throwing
      return {
        profile: null,
        summary: `Unable to retrieve company profile: ${apiError.message}`
      };
    }
  },
}); 