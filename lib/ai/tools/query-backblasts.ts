import { tool } from 'ai';
import { z } from 'zod';
import {
  getAllBackblasts,
  getBackblastsByDateRange,
  getBackblastsByAO,
  getBackblastsByAOAndDateRange,
  getBackblastsByQ,
  searchBackblasts,
  getBackblastStats,
  getTopAOs,
  getTopQs,
  getRecentBackblasts,
} from '@/lib/db/queries.f3';

export const queryBackblasts = tool({
  description: 'Query F3 backblast data with various search and filter options',
  parameters: z.object({
    queryType: z
      .enum([
        'all',
        'recent',
        'byDateRange',
        'byAO',
        'byQ',
        'search',
        'stats',
        'topAOs',
        'topQs',
      ])
      .optional()
      .describe('The type of query to perform (auto-detected if not provided)'),
    limit: z
      .number()
      .optional()
      .default(20)
      .describe('Maximum number of results to return'),
    offset: z
      .number()
      .optional()
      .default(0)
      .describe('Number of results to skip for pagination'),
    startDate: z
      .string()
      .optional()
      .describe('Start date for date range queries (YYYY-MM-DD format)'),
    endDate: z
      .string()
      .optional()
      .describe('End date for date range queries (YYYY-MM-DD format)'),
    ao: z.string().optional().describe('AO name to search for (partial match)'),
    q: z.string().optional().describe('Q name to search for (partial match)'),
    searchTerm: z
      .string()
      .optional()
      .describe('Text to search for in backblast content'),
    days: z
      .number()
      .optional()
      .default(30)
      .describe('Number of days to look back for recent backblasts'),
  }),
  execute: async ({
    queryType,
    limit,
    offset,
    startDate,
    endDate,
    ao,
    q,
    searchTerm,
    days,
  }) => {
    // Declare effectiveQueryType at the beginning of the function
    let effectiveQueryType = queryType;

    try {
      console.log('Debug: queryBackblasts called with params:', {
        queryType,
        ao,
        startDate,
        endDate,
        searchTerm,
        limit,
        offset,
      });

      // Special case: if both AO and date range are provided, use combined query
      if (ao && (startDate || endDate)) {
        console.log('Debug: Detected combined AO + date range query');

        // Ensure we have both dates
        if (!startDate || !endDate) {
          throw new Error(
            `Both startDate and endDate are required when filtering by AO and date range. Received: ao="${ao}", startDate="${startDate}", endDate="${endDate}"`,
          );
        }

        // Parse dates and ensure they're in the correct format
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Validate dates
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
          throw new Error(
            `Invalid date format. Please use YYYY-MM-DD format. Received: startDate="${startDate}", endDate="${endDate}"`,
          );
        }

        // Set proper time ranges for full day coverage
        start.setUTCHours(0, 0, 0, 0);
        end.setUTCHours(23, 59, 59, 999);

        // Format dates to YYYY-MM-DD
        const formattedStartDate = start.toISOString().split('T')[0];
        const formattedEndDate = end.toISOString().split('T')[0];

        console.log(
          `Debug: Querying backblasts for AO "${ao}" between ${formattedStartDate} and ${formattedEndDate}`,
        );

        const results = await getBackblastsByAOAndDateRange({
          ao,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          limit,
          offset,
        });

        console.log(
          `Debug: Found ${results.length} backblasts for AO "${ao}" between ${formattedStartDate} and ${formattedEndDate}`,
        );

        return results;
      }

      // If we have AO but no dates, or dates but no AO, log a warning
      if (ao && !startDate && !endDate) {
        console.log('Debug: AO provided but no date range - using byAO query');
      } else if ((startDate || endDate) && !ao) {
        console.log(
          'Debug: Date range provided but no AO - using byDateRange query',
        );
      }

      // Auto-detect query type based on parameters if not explicitly provided
      if (!effectiveQueryType) {
        if (searchTerm) {
          effectiveQueryType = 'search';
        } else if (q) {
          effectiveQueryType = 'byQ';
        } else if (ao && startDate && endDate) {
          effectiveQueryType = 'byAO'; // Will be handled by combined query above
        } else if (ao) {
          effectiveQueryType = 'byAO';
        } else if (startDate && endDate) {
          effectiveQueryType = 'byDateRange';
        } else {
          effectiveQueryType = 'recent';
        }
      }

      console.log(`Debug: Using query type: ${effectiveQueryType}`);

      switch (effectiveQueryType) {
        case 'all':
          return await getAllBackblasts({ limit, offset });

        case 'recent':
          return await getRecentBackblasts({ days, limit });

        case 'byDateRange':
          if (!startDate || !endDate) {
            throw new Error(
              'startDate and endDate are required for byDateRange queries',
            );
          }
          return await getBackblastsByDateRange({
            startDate,
            endDate,
            limit,
            offset,
          });

        case 'byAO':
          if (!ao) {
            throw new Error('ao parameter is required for byAO queries');
          }
          return await getBackblastsByAO({ ao, limit, offset });

        case 'byQ':
          if (!q) {
            throw new Error('q parameter is required for byQ queries');
          }
          return await getBackblastsByQ({ q, limit, offset });

        case 'search':
          if (!searchTerm) {
            throw new Error('searchTerm is required for search queries');
          }
          return await searchBackblasts({ searchTerm, limit, offset });

        case 'stats':
          if (!startDate || !endDate) {
            throw new Error(
              'startDate and endDate are required for stats queries',
            );
          }
          return await getBackblastStats({ startDate, endDate });

        case 'topAOs':
          if (!startDate || !endDate) {
            throw new Error(
              'startDate and endDate are required for topAOs queries',
            );
          }
          return await getTopAOs({ limit, startDate, endDate });

        case 'topQs':
          if (!startDate || !endDate) {
            throw new Error(
              'startDate and endDate are required for topQs queries',
            );
          }
          return await getTopQs({ limit, startDate, endDate });

        default:
          throw new Error(`Unknown query type: ${effectiveQueryType}`);
      }
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        queryType: effectiveQueryType,
        parameters: {
          limit,
          offset,
          startDate,
          endDate,
          ao,
          q,
          searchTerm,
          days,
        },
      };
    }
  },
});
