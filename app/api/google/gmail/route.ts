import { withAuth } from '@workos-inc/authkit-nextjs';
import { getDatabaseUserFromWorkOS } from '@/lib/db/queries';
import {
  getGoogleGmailClient,
  hasGoogleCredentials,
} from '@/lib/google/client';
import { NextResponse } from 'next/server';
import type { gmail_v1 } from 'googleapis';

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
    const action = searchParams.get('action') || 'list'; // 'list' or 'get'
    
    // Common parameters
    const maxResults = Number.parseInt(
      searchParams.get('maxResults') || '10',
      10,
    );
    const query = searchParams.get('q'); // Gmail search query
    const labelIds = searchParams.get('labelIds')?.split(',');
    const includeSpamTrash = searchParams.get('includeSpamTrash') === 'true';
    const pageToken = searchParams.get('pageToken');

    // Parameters for getting specific messages
    const messageIds = searchParams.get('messageIds')?.split(',');
    const format = (searchParams.get('format') as 'full' | 'metadata' | 'minimal') || 'metadata';

    // Check if user has Google credentials
    const hasCredentials = await hasGoogleCredentials(databaseUser.id);
    if (!hasCredentials) {
      return NextResponse.json(
        {
          error: 'Gmail not connected',
          message: 'Please authenticate with Google first.',
        },
        { status: 403 },
      );
    }

    // Get Google Gmail client
    const gmail = await getGoogleGmailClient(databaseUser.id);

    if (action === 'list') {
      // List messages
      const params: gmail_v1.Params$Resource$Users$Messages$List = {
        userId: 'me',
        maxResults,
        includeSpamTrash,
        q: query || undefined,
        labelIds: labelIds || undefined,
        pageToken: pageToken || undefined,
      };

      const response = await gmail.users.messages.list(params);
      const messages = response.data.messages || [];

      // Get basic metadata for each message
      const messageDetails = await Promise.all(
        messages.slice(0, maxResults).map(async (message) => {
          try {
            const messageResponse = await gmail.users.messages.get({
              userId: 'me',
              id: message.id || '',
              format: 'metadata',
              metadataHeaders: [
                'Subject',
                'From',
                'To',
                'Date',
                'Message-ID',
              ],
            });

            const headers = messageResponse.data.payload?.headers || [];
            const getHeader = (name: string) =>
              headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())
                ?.value || '';

            return {
              id: message.id,
              threadId: message.threadId,
              labelIds: messageResponse.data.labelIds || [],
              snippet: messageResponse.data.snippet || '',
              internalDate: messageResponse.data.internalDate
                ? new Date(Number.parseInt(messageResponse.data.internalDate))
                : null,
              subject: getHeader('Subject'),
              from: getHeader('From'),
              to: getHeader('To'),
              date: getHeader('Date'),
              messageId: getHeader('Message-ID'),
              sizeEstimate: messageResponse.data.sizeEstimate || 0,
            };
          } catch (error) {
            return {
              id: message.id,
              threadId: message.threadId,
              error: 'Failed to fetch message details',
            };
          }
        }),
      );

      return NextResponse.json({
        messages: messageDetails,
        nextPageToken: response.data.nextPageToken || null,
        resultSizeEstimate: response.data.resultSizeEstimate || 0,
        query: query || 'all messages',
        hasMore: !!response.data.nextPageToken,
      });
    } else if (action === 'get' && messageIds) {
      // Get specific message details
      const messageDetails = await Promise.all(
        messageIds.map(async (messageId) => {
          try {
            const response = await gmail.users.messages.get({
              userId: 'me',
              id: messageId,
              format,
            });

            const message = response.data;
            const headers = message.payload?.headers || [];

            const getHeader = (name: string) =>
              headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())
                ?.value || '';

            return {
              id: messageId,
              threadId: message.threadId,
              labelIds: message.labelIds || [],
              snippet: message.snippet || '',
              historyId: message.historyId,
              internalDate: message.internalDate
                ? new Date(Number.parseInt(message.internalDate))
                : null,
              sizeEstimate: message.sizeEstimate || 0,
              headers: {
                messageId: getHeader('Message-ID'),
                subject: getHeader('Subject'),
                from: getHeader('From'),
                to: getHeader('To'),
                cc: getHeader('Cc'),
                date: getHeader('Date'),
              },
              payload: format === 'full' ? message.payload : undefined,
              raw: format === 'full' ? message.raw : undefined,
            };
          } catch (error) {
            return {
              id: messageId,
              error: `Failed to fetch message: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
          }
        }),
      );

      return NextResponse.json({
        messages: messageDetails,
        total: messageDetails.length,
        format,
      });
    } else {
      return NextResponse.json(
        {
          error: 'Invalid action or missing parameters',
          message: 'Use action=list to list messages or action=get with messageIds to get specific messages.',
        },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error('Error in Gmail API:', error);

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
            message: 'Gmail API quota exceeded. Please try again later.',
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

      if (error.message.includes('Invalid query')) {
        return NextResponse.json(
          {
            error: 'Invalid query',
            message: 'Invalid Gmail search query. Please check your search syntax.',
          },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to access Gmail',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}