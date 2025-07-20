import { tool, type UIMessageStreamWriter } from 'ai';
import { z } from 'zod';
import type { ChatMessage, Session } from '@/lib/types';
import { ChatSDKError } from '@/lib/errors';
import { getDatabaseUserFromWorkOS } from '@/lib/db/queries';
import {
  getGoogleGmailClient,
  hasGoogleCredentials,
} from '@/lib/google/client';
import type { gmail_v1 } from 'googleapis';

interface ListGmailMessagesProps {
  session: Session;
  dataStream: UIMessageStreamWriter<ChatMessage>;
}

export const listGmailMessages = ({
  session,
  dataStream,
}: ListGmailMessagesProps) =>
  tool({
    description:
      'Lists Gmail messages for the authenticated user. Supports Gmail search syntax for powerful filtering (e.g., "from:example@domain.com", "subject:meeting", "is:unread", "after:2025/1/1"). Only works if user has connected their Google account.',
    inputSchema: z.object({
      query: z
        .string()
        .optional()
        .describe(
          'Gmail search query using Gmail search syntax (e.g., "from:boss@company.com subject:urgent", "is:unread after:2025/1/15", "has:attachment"). Leave empty to list all messages.',
        ),
      maxResults: z
        .number()
        .int()
        .min(1)
        .max(100)
        .default(10)
        .describe('Maximum number of messages to return (1-100).'),
      labelIds: z
        .array(z.string())
        .optional()
        .describe(
          'Filter by label IDs (e.g., ["INBOX", "UNREAD", "IMPORTANT"]). Common labels: INBOX, SENT, DRAFT, SPAM, TRASH, UNREAD, STARRED, IMPORTANT.',
        ),
      includeSpamTrash: z
        .boolean()
        .default(false)
        .describe('Whether to include messages from spam and trash.'),
      pageToken: z
        .string()
        .optional()
        .describe('Token for pagination to get next page of results.'),
    }),
    execute: async ({
      query,
      maxResults,
      labelIds,
      includeSpamTrash,
      pageToken,
    }) => {
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
            'Gmail is not connected. Please authenticate with Google first.',
          );
        }

        // Get Google Gmail client
        const gmail = await getGoogleGmailClient(databaseUser.id);

        // Build request parameters
        const params: gmail_v1.Params$Resource$Users$Messages$List = {
          userId: 'me',
          maxResults: maxResults ?? 10,
          includeSpamTrash: includeSpamTrash ?? false,
          q: query || undefined,
          labelIds: labelIds || undefined,
          pageToken: pageToken || undefined,
        };

        // Fetch messages from Gmail
        const response = await gmail.users.messages.list(params);
        const messages = response.data.messages || [];

        // Get basic info for each message (id, threadId, labelIds)
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
              // If we can't get details for a specific message, return basic info
              return {
                id: message.id,
                threadId: message.threadId,
                error: 'Failed to fetch message details',
              };
            }
          }),
        );

        return {
          messages: messageDetails,
          nextPageToken: response.data.nextPageToken || null,
          resultSizeEstimate: response.data.resultSizeEstimate || 0,
          total: messageDetails.length,
          query: query || 'all messages',
          hasMore: !!response.data.nextPageToken,
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
            'Gmail API quota exceeded. Please try again later.',
          );
        }

        if (
          errorMessage.includes('forbidden') ||
          errorMessage.includes('permission')
        ) {
          throw new ChatSDKError(
            'forbidden:chat',
            'Insufficient permissions to access Gmail.',
          );
        }

        if (errorMessage.includes('Invalid query')) {
          throw new ChatSDKError(
            'bad_request:chat',
            'Invalid Gmail search query. Please check your search syntax.',
          );
        }

        throw new ChatSDKError(
          'bad_request:chat',
          `Failed to fetch Gmail messages: ${errorMessage}`,
        );
      }
    },
  });