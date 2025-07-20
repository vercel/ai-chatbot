import { tool, type UIMessageStreamWriter } from 'ai';
import { z } from 'zod';
import type { ChatMessage, Session } from '@/lib/types';
import { ChatSDKError } from '@/lib/errors';
import { getDatabaseUserFromWorkOS } from '@/lib/db/queries';
import {
  getGoogleCalendarClient,
  hasGoogleCredentials,
} from '@/lib/google/client';
import type { calendar_v3 } from 'googleapis';

interface ListGoogleCalendarEventsProps {
  session: Session;
  dataStream: UIMessageStreamWriter<ChatMessage>;
}

export const listGoogleCalendarEvents = ({
  session,
  dataStream,
}: ListGoogleCalendarEventsProps) =>
  tool({
    description:
      'Lists Google Calendar events for the authenticated user. Can filter by time range and limit results. Only works if user has connected their Google account. To accurately list events, ensure you know what the date is currently and use the correct time range.',
    inputSchema: z.object({
      timeMin: z
        .string()
        .optional()
        .describe(
          'Start time for the search in ISO 8601 format (e.g., "2025-01-01T00:00:00Z"). Defaults to now if not provided.',
        ),
      timeMax: z
        .string()
        .optional()
        .describe(
          'End time for the search in ISO 8601 format (e.g., "2025-12-31T23:59:59Z"). Defaults to 7 days from now if not provided.',
        ),
      maxResults: z
        .number()
        .int()
        .min(1)
        .max(50)
        .default(10)
        .describe('Maximum number of events to return (1-50).'),
      singleEvents: z
        .boolean()
        .default(true)
        .describe(
          'Whether to expand recurring events into individual instances.',
        ),
    }),
    execute: async ({ timeMin, timeMax, maxResults, singleEvents }) => {
      try {
        if (!session?.user?.email) {
          throw new ChatSDKError(
            'unauthorized:chat',
            'No user email in session',
          );
        }

        // Get the database user
        const databaseUser = await getDatabaseUserFromWorkOS({
          id: session.user.id,
          email: session.user.email,
        });

        if (!databaseUser) {
          throw new ChatSDKError(
            'unauthorized:chat',
            'User not found in database',
          );
        }

        // Check if user has Google credentials
        const hasCredentials = await hasGoogleCredentials(databaseUser.id);
        if (!hasCredentials) {
          throw new ChatSDKError(
            'bad_request:chat',
            'Google Calendar is not connected. Please authenticate with Google first.',
          );
        }

        // Get Google Calendar client
        const calendar = await getGoogleCalendarClient(databaseUser.id);

        // Set defaults for time range
        const now = new Date();
        const sevenDaysFromNow = new Date(
          now.getTime() + 7 * 24 * 60 * 60 * 1000,
        );

        const defaultTimeMin = now.toISOString();
        const defaultTimeMax = sevenDaysFromNow.toISOString();

        // Build request parameters
        const params: calendar_v3.Params$Resource$Events$List = {
          calendarId: 'primary',
          maxResults: maxResults ?? 10,
          singleEvents: singleEvents ?? true,
          orderBy: 'startTime',
          timeMin: timeMin || defaultTimeMin,
          timeMax: timeMax || defaultTimeMax,
        };

        // Fetch events from Google Calendar
        const response = await calendar.events.list(params);
        const events = response.data.items || [];

        return {
          events: events.map((event) => ({
            id: event.id,
            summary: event.summary,
            description: event.description,
            start: event.start,
            end: event.end,
            location: event.location,
            attendees: event.attendees,
            organizer: event.organizer,
            status: event.status,
            htmlLink: event.htmlLink,
            created: event.created,
            updated: event.updated,
          })),
          timeZone: response.data.timeZone,
          updated: response.data.updated,
          total: events.length,
        };
      } catch (error) {
        if (error instanceof ChatSDKError) {
          throw error;
        }

        // Handle Google API specific errors
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';

        if (
          errorMessage.includes('invalid_grant') ||
          errorMessage.includes('token expired')
        ) {
          throw new ChatSDKError(
            'unauthorized:chat',
            'Google access token has expired. Please re-authenticate with Google.',
          );
        }

        if (errorMessage.includes('quota')) {
          throw new ChatSDKError(
            'rate_limit:chat',
            'Google Calendar API quota exceeded. Please try again later.',
          );
        }

        if (
          errorMessage.includes('forbidden') ||
          errorMessage.includes('permission')
        ) {
          throw new ChatSDKError(
            'forbidden:chat',
            'Insufficient permissions to access Google Calendar.',
          );
        }

        throw new ChatSDKError(
          'bad_request:chat',
          `Failed to fetch calendar events: ${errorMessage}`,
        );
      }
    },
  });
