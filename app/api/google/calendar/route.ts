import { withAuth } from '@workos-inc/authkit-nextjs';
import { getDatabaseUserFromWorkOS } from '@/lib/db/queries';
import {
  getGoogleCalendarClient,
  hasGoogleCredentials,
} from '@/lib/google/client';
import { NextResponse } from 'next/server';
import type { calendar_v3 } from 'googleapis';

export async function GET(request: Request) {
  try {
    const { user } = await withAuth();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the database user
    const databaseUser = await getDatabaseUserFromWorkOS({
      id: user.id,
      email: user.email,
    });

    if (!databaseUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const timeMin = searchParams.get('timeMin');
    const timeMax = searchParams.get('timeMax');
    const maxResults = Number.parseInt(
      searchParams.get('maxResults') || '10',
      10,
    );
    const singleEvents = searchParams.get('singleEvents') === 'true';
    const orderBy = searchParams.get('orderBy') || 'startTime';

    // Check if user has Google credentials
    const hasCredentials = await hasGoogleCredentials(databaseUser.id);
    if (!hasCredentials) {
      return NextResponse.json(
        {
          error: 'Google Calendar not connected',
          message: 'Please authenticate with Google first.',
        },
        { status: 403 },
      );
    }

    // Get Google Calendar client
    const calendar = await getGoogleCalendarClient(databaseUser.id);

    // Build request parameters
    const params: calendar_v3.Params$Resource$Events$List = {
      calendarId: 'primary',
      maxResults,
      singleEvents,
      orderBy,
      timeMin: timeMin || undefined,
      timeMax: timeMax || undefined,
    };

    // Fetch events
    const response = await calendar.events.list(params);
    const events = response.data.items || [];

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('Error in Google Calendar API:', error);

    if (error instanceof Error) {
      // Handle specific Google API errors
      if (
        error.message.includes('invalid_grant') ||
        error.message.includes('token expired')
      ) {
        return NextResponse.json(
          {
            error: 'Token expired',
            message: 'Google access token has expired. Please re-authenticate.',
          },
          { status: 401 },
        );
      }

      if (error.message.includes('quota')) {
        return NextResponse.json(
          {
            error: 'Quota exceeded',
            message:
              'Google Calendar API quota exceeded. Please try again later.',
          },
          { status: 429 },
        );
      }

      if (
        error.message.includes('forbidden') ||
        error.message.includes('permission')
      ) {
        return NextResponse.json(
          {
            error: 'Insufficient permissions',
            message: 'Please check your Google account permissions.',
          },
          { status: 403 },
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch calendar events',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
