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

interface FetchSlackChannelHistoryProps {
  session: Session;
  dataStream: UIMessageStreamWriter<ChatMessage>;
}

export const fetchSlackChannelHistory = ({
  session,
  dataStream,
}: FetchSlackChannelHistoryProps) =>
  tool({
    description:
      'Fetch message history from a specific Slack channel. Members can only access channels they belong to.',
    inputSchema: z.object({
      channel: z.string().describe('The Slack channel ID (e.g., C1234567890)'),
      limit: z
        .number()
        .min(1)
        .max(1000)
        .optional()
        .default(100)
        .describe('Maximum number of messages to fetch'),
    }),
    execute: async ({ channel, limit = 100 }) => {
      try {
        if (!session?.user?.email) {
          throw new ChatSDKError(
            'unauthorized:chat',
            'No user email in session',
          );
        }

        // Get Slack user ID (will cache in database if not present)
        const slackUserId = await fetchSlackUserIdByEmail(session.user.email);

        // RBAC check - members must be in the channel
        if (session.role === 'member') {
          const isChannelMember = await isMember(channel, slackUserId);
          if (!isChannelMember) {
            throw new ChatSDKError(
              'forbidden:chat',
              'You do not have access to this Slack channel',
            );
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

        const result = {
          channel_id: channel,
          messages: enrichedMessages,
          message_count: enrichedMessages.length,
          requested_limit: limit,
          user_role: session.role || 'guest',
        };

        return JSON.stringify(result);
      } catch (error) {
        const errorMessage =
          error instanceof SlackError || error instanceof ChatSDKError
            ? error.message
            : 'Failed to fetch Slack channel history';

        throw new ChatSDKError('bad_request:chat', errorMessage);
      }
    },
  });
