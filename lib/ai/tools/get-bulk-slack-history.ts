import { tool, type UIMessageStreamWriter } from 'ai';
import { z } from 'zod';
import type { ChatMessage, Session } from '@/lib/types';
import {
  fetchSlackUserIdByEmail,
  fetchChannelHistory,
  isMember,
  SlackError,
} from '@/lib/slack/client';
import { ChatSDKError } from '@/lib/errors';

interface GetBulkSlackHistoryProps {
  session: Session;
  dataStream: UIMessageStreamWriter<ChatMessage>;
}

export const getBulkSlackHistory = ({
  session,
  dataStream,
}: GetBulkSlackHistoryProps) =>
  tool({
    description:
      'Fetch message history from multiple Slack channels efficiently. Members can only access channels they belong to.',
    inputSchema: z.object({
      channels: z
        .array(z.string())
        .min(1)
        .max(10)
        .describe(
          'Array of Slack channel IDs (e.g., ["C1234567890", "C0987654321"])',
        ),
      limit: z
        .number()
        .min(1)
        .max(1000)
        .optional()
        .default(100)
        .describe('Maximum number of messages to fetch per channel'),
    }),
    execute: async ({ channels, limit = 100 }) => {
      try {
        if (!session?.user?.email) {
          throw new ChatSDKError(
            'unauthorized:chat',
            'No user email in session',
          );
        }

        // Get Slack user ID (will cache in database if not present)
        const slackUserId = await fetchSlackUserIdByEmail(session.user.email);

        const results: any[] = [];
        const accessDenied: string[] = [];
        const errors: { channel: string; error: string }[] = [];

        // Process each channel
        for (const channel of channels) {
          try {
            // RBAC check - members must be in the channel
            if (session.role === 'member') {
              const isChannelMember = await isMember(channel, slackUserId);
              if (!isChannelMember) {
                // Silently skip channels the user can't access
                accessDenied.push(channel);
                continue;
              }
            }

            // Fetch the channel history
            const messages = await fetchChannelHistory(channel, limit);

            // Enrich messages with user information
            const enrichedMessages = await Promise.all(
              messages.map(async (message: any) => {
                let userName = 'Unknown User';

                if (message.user) {
                  try {
                    // This is a simple approach - in a real system you might want
                    // to batch user lookups or cache user info
                    userName = message.user; // For now, just use the user ID
                  } catch {
                    // Ignore errors looking up users
                  }
                }

                return {
                  ...message,
                  user_name: userName,
                  timestamp: message.ts,
                  text: message.text || '',
                  thread_ts: message.thread_ts,
                  type: message.type || 'message',
                };
              }),
            );

            results.push({
              channel_id: channel,
              messages: enrichedMessages,
              message_count: enrichedMessages.length,
              requested_limit: limit,
            });
          } catch (error) {
            const errorMessage =
              error instanceof SlackError || error instanceof ChatSDKError
                ? error.message
                : 'Unknown error';

            errors.push({
              channel,
              error: errorMessage,
            });
          }
        }

        const result = {
          channel_results: results,
          total_channels_requested: channels.length,
          total_channels_processed: results.length,
          access_denied_count: accessDenied.length,
          error_count: errors.length,
          errors: errors.length > 0 ? errors : undefined,
          user_role: session.role || 'guest',
          total_messages: results.reduce((sum, r) => sum + r.message_count, 0),
        };

        return JSON.stringify(result);
      } catch (error) {
        const errorMessage =
          error instanceof SlackError || error instanceof ChatSDKError
            ? error.message
            : 'Failed to fetch bulk Slack history';

        throw new ChatSDKError('bad_request:chat', errorMessage);
      }
    },
  });
