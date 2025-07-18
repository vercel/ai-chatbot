import 'server-only';

import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { user } from '@/lib/db/schema';
import { ChatSDKError } from '@/lib/errors';

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export class SlackError extends Error {
  public statusCode: number;
  public slackError?: string;

  constructor(message: string, statusCode = 500, slackError?: string) {
    super(message);
    this.name = 'SlackError';
    this.statusCode = statusCode;
    this.slackError = slackError;
  }
}

// In-memory cache for membership checks (5-minute TTL)
const membershipCache = new Map<string, { result: boolean; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(channelId: string, slackUserId: string): string {
  return `${channelId}:${slackUserId}`;
}

async function makeSlackRequest(
  endpoint: string,
  params: Record<string, string> = {},
) {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    throw new SlackError('SLACK_BOT_TOKEN not configured', 500);
  }

  const url = new URL(`https://slack.com/api/${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 429) {
      // Rate limited
      const retryAfter = response.headers.get('Retry-After');
      const waitTime = retryAfter
        ? Number.parseInt(retryAfter) * 1000
        : Math.pow(2, attempt) * 1000;
      console.log(
        `Slack rate limit hit, waiting ${waitTime}ms before retry ${attempt + 1}`,
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      attempt++;
      continue;
    }

    if (!response.ok) {
      throw new SlackError(
        `Slack API error: ${response.status} ${response.statusText}`,
        response.status,
      );
    }

    const data = await response.json();
    if (!data.ok) {
      throw new SlackError(
        `Slack API returned error: ${data.error}`,
        400,
        data.error,
      );
    }

    return data;
  }

  throw new SlackError('Max retries exceeded for Slack API request', 500);
}

export async function fetchSlackUserIdByEmail(email: string): Promise<string> {
  try {
    // First check if we already have it cached in the database
    const users = await db.select().from(user).where(eq(user.email, email));
    const dbUser = users[0];

    if (!dbUser) {
      throw new ChatSDKError('not_found:database', 'User not found');
    }

    if (dbUser.slackUserId) {
      return dbUser.slackUserId;
    }

    // Look up the Slack user ID
    const data = await makeSlackRequest('users.lookupByEmail', { email });
    const slackUserId = data.user?.id;

    if (!slackUserId) {
      throw new SlackError('User not found in Slack workspace', 404);
    }

    // Cache the result in the database
    await db.update(user).set({ slackUserId }).where(eq(user.email, email));

    return slackUserId;
  } catch (error) {
    if (error instanceof SlackError || error instanceof ChatSDKError) {
      throw error;
    }
    throw new SlackError(`Failed to fetch Slack user ID: ${error}`);
  }
}

export async function isMember(
  channelId: string,
  slackUserId: string,
): Promise<boolean> {
  const cacheKey = getCacheKey(channelId, slackUserId);
  const cached = membershipCache.get(cacheKey);

  if (cached && cached.expiry > Date.now()) {
    return cached.result;
  }

  try {
    const data = await makeSlackRequest('conversations.members', {
      channel: channelId,
      limit: '1000', // Slack's max
    });

    const isMemberResult = data.members?.includes(slackUserId) || false;

    // Cache the result
    membershipCache.set(cacheKey, {
      result: isMemberResult,
      expiry: Date.now() + CACHE_TTL,
    });

    return isMemberResult;
  } catch (error) {
    if (error instanceof SlackError) {
      throw error;
    }
    throw new SlackError(`Failed to check membership: ${error}`);
  }
}

export async function fetchChannelHistory(channelId: string, limit = 100) {
  try {
    const data = await makeSlackRequest('conversations.history', {
      channel: channelId,
      limit: limit.toString(),
    });

    return data.messages || [];
  } catch (error) {
    if (error instanceof SlackError) {
      throw error;
    }
    throw new SlackError(`Failed to fetch channel history: ${error}`);
  }
}

export async function fetchThread(channelId: string, threadTs: string) {
  try {
    const data = await makeSlackRequest('conversations.replies', {
      channel: channelId,
      ts: threadTs,
    });

    return data.messages || [];
  } catch (error) {
    if (error instanceof SlackError) {
      throw error;
    }
    throw new SlackError(`Failed to fetch thread: ${error}`);
  }
}

export async function fetchBotChannels() {
  try {
    const data = await makeSlackRequest('users.conversations', {
      types: 'public_channel,private_channel',
      exclude_archived: 'true',
      limit: '1000',
    });

    return data.channels || [];
  } catch (error) {
    if (error instanceof SlackError) {
      throw error;
    }
    throw new SlackError(`Failed to fetch bot channels: ${error}`);
  }
}
