import 'server-only';

import { createClient, type RedisClientType } from 'redis';

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

const EMAIL_TTL_SECONDS = 24 * 60 * 60 * 7; // 7d
const MEMBER_TTL_POS_SECONDS = 24 * 60 * 60; // 24h for confirmed members
const MEMBER_TTL_NEG_SECONDS = 5 * 60; // 5m for non-members

let redisClient: RedisClientType | null = null;
let redisReady: Promise<unknown> | null = null;

async function getRedis(): Promise<RedisClientType> {
  if (!process.env.REDIS_URL) {
    throw new SlackError('REDIS_URL not configured', 500);
  }
  if (!redisClient) {
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on('error', (err) => {
      console.error('Redis error', err);
    });
    redisReady = redisClient.connect();
  }
  if (redisReady) await redisReady;
  if (!redisClient) {
    throw new SlackError('Redis client not initialized', 500);
  }
  return redisClient;
}

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
    const redis = await getRedis();
    const emailKey = `slack:email:${email.toLowerCase()}`;
    const cachedId = await redis.get(emailKey);
    if (cachedId) return cachedId;

    const data = await makeSlackRequest('users.lookupByEmail', { email });
    const slackUserId = data.user?.id;

    if (!slackUserId) {
      throw new SlackError('User not found in Slack workspace', 404);
    }

    await redis.set(emailKey, slackUserId, { EX: EMAIL_TTL_SECONDS });

    return slackUserId;
  } catch (error) {
    if (error instanceof SlackError) {
      throw error;
    }
    throw new SlackError(`Failed to fetch Slack user ID: ${error}`);
  }
}

export async function isMember(
  channelId: string,
  slackUserId: string,
): Promise<boolean> {
  const redis = await getRedis();
  const key = `slack:member:${getCacheKey(channelId, slackUserId)}`;
  const cached = await redis.get(key);
  if (cached === '1') return true;
  if (cached === '0') return false;

  try {
    const data = await makeSlackRequest('conversations.members', {
      channel: channelId,
      limit: '1000',
    });

    const isMemberResult = data.members?.includes(slackUserId) || false;
    await redis.set(key, isMemberResult ? '1' : '0', {
      EX: isMemberResult ? MEMBER_TTL_POS_SECONDS : MEMBER_TTL_NEG_SECONDS,
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
