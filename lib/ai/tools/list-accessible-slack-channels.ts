import { tool, type UIMessageStreamWriter } from 'ai';
import { z } from 'zod';
import type { ChatMessage, Session } from '@/lib/types';
import {
  fetchSlackUserIdByEmail,
  fetchBotChannels,
  isMember,
  SlackError,
} from '@/lib/slack/client';
import { ChatSDKError } from '@/lib/errors';

interface ListAccessibleSlackChannelsProps {
  session: Session;
  dataStream: UIMessageStreamWriter<ChatMessage>;
}

export const listAccessibleSlackChannels = ({
  session,
  dataStream,
}: ListAccessibleSlackChannelsProps) =>
  tool({
    description:
      'Lists Slack channels the current user may read from. Admins see everything; members see only the channels they belong to.',
    inputSchema: z.object({}),
    execute: async () => {
      try {
        if (!session?.user?.email) {
          throw new ChatSDKError(
            'unauthorized:chat',
            'No user email in session',
          );
        }

        // Get Slack user ID (will cache in database if not present)
        const slackUserId = await fetchSlackUserIdByEmail(session.user.email);

        // Get all channels the bot can see
        const allChannels = await fetchBotChannels();

        let accessibleChannels = allChannels;

        // RBAC filter - only admins see everything
        if (session.role !== 'admin') {
          accessibleChannels = [];

          // For members/guests, check membership for each channel
          for (const channel of allChannels) {
            if (await isMember(channel.id, slackUserId)) {
              accessibleChannels.push(channel);
            }
          }
        }

        const result = {
          channels: accessibleChannels.map((ch: any) => ({
            id: ch.id,
            name: ch.name,
            is_private: ch.is_private || false,
            num_members: ch.num_members || 0,
            topic: ch.topic?.value || '',
            purpose: ch.purpose?.value || '',
          })),
          user_role: session.role || 'guest',
          total_accessible: accessibleChannels.length,
          total_bot_channels: allChannels.length,
        };

        return JSON.stringify(result);
      } catch (error) {
        const errorMessage =
          error instanceof SlackError || error instanceof ChatSDKError
            ? error.message
            : 'Failed to list Slack channels';

        throw new ChatSDKError('bad_request:chat', errorMessage);
      }
    },
  });
