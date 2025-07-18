import { tool, type UIMessageStreamWriter } from 'ai';
import { z } from 'zod';
import type { ChatMessage, Session } from '@/lib/types';
import {
  fetchSlackUserIdByEmail,
  fetchThread,
  isMember,
  SlackError,
} from '@/lib/slack/client';
import { ChatSDKError } from '@/lib/errors';

interface GetSlackThreadRepliesProps {
  session: Session;
  dataStream: UIMessageStreamWriter<ChatMessage>;
}

export const getSlackThreadReplies = ({
  session,
  dataStream,
}: GetSlackThreadRepliesProps) =>
  tool({
    description:
      'Get all replies in a specific Slack thread. Members can only access threads in channels they belong to.',
    inputSchema: z.object({
      channel: z.string().describe('The Slack channel ID (e.g., C1234567890)'),
      thread_ts: z
        .string()
        .describe(
          'The timestamp ID of the parent message that started the thread',
        ),
    }),
    execute: async ({ channel, thread_ts }) => {
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

        // Fetch the thread replies
        const messages = await fetchThread(channel, thread_ts);

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
              is_parent: message.ts === thread_ts,
            };
          }),
        );

        const parentMessage = enrichedMessages.find((m) => m.is_parent);
        const replies = enrichedMessages.filter((m) => !m.is_parent);

        const result = {
          channel_id: channel,
          thread_ts,
          parent_message: parentMessage,
          replies,
          total_messages: enrichedMessages.length,
          reply_count: replies.length,
          user_role: session.role || 'guest',
        };

        return JSON.stringify(result);
      } catch (error) {
        const errorMessage =
          error instanceof SlackError || error instanceof ChatSDKError
            ? error.message
            : 'Failed to fetch Slack thread replies';

        throw new ChatSDKError('bad_request:chat', errorMessage);
      }
    },
  });
