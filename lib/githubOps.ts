/**
 * GitHub Ops Integration
 * Integrates with Vercel and Supabase GitHub Apps via PR comments
 */

import { Octokit } from "@octokit/rest";
import DevinLogger from "./devinLogger";
import { getTiqologyDb } from "./tiqologyDb";

// ============================================
// TYPES
// ============================================

export interface GitHubComment {
  id: number;
  body: string;
  user: {
    login: string;
    type: string; // 'Bot' or 'User'
  };
  created_at: string;
  updated_at: string;
}

export interface BotCommand {
  bot: "vercel" | "supabase" | "other";
  command: string;
  params?: string[];
  rawCommand: string;
}

export interface BotResponse {
  bot: string;
  status: "pending" | "success" | "failure" | "timeout";
  message?: string;
  url?: string;
  timestamp: string;
}

// ============================================
// CONFIGURATION
// ============================================

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const REPO_OWNER = process.env.GITHUB_REPO_OWNER || "MrAllgoodWilson";
const REPO_NAME = process.env.GITHUB_REPO_NAME || "ai-chatbot";

const BOT_USERNAMES = {
  vercel: "vercel[bot]",
  supabase: "supabase[bot]",
};

const COMMAND_PATTERNS = {
  // Vercel commands
  vercel_deploy: /^\/vercel\s+deploy\s+(production|preview|staging)/i,
  vercel_rollback: /^\/vercel\s+rollback/i,
  vercel_inspect: /^\/vercel\s+inspect/i,

  // Supabase commands
  supabase_migrate: /^\/supabase\s+migrate\s+(.+\.sql)/i,
  supabase_backup: /^\/supabase\s+backup/i,
  supabase_restore: /^\/supabase\s+restore\s+(.+)/i,
};

// ============================================
// GITHUB CLIENT
// ============================================

let octokitClient: Octokit | null = null;

function getOctokit(): Octokit {
  if (!octokitClient) {
    if (!GITHUB_TOKEN) {
      throw new Error(
        "GITHUB_TOKEN or GH_TOKEN environment variable is required"
      );
    }
    octokitClient = new Octokit({ auth: GITHUB_TOKEN });
  }
  return octokitClient;
}

// ============================================
// PR OPERATIONS
// ============================================

/**
 * Create a pull request
 */
export async function createPullRequest(
  branch: string,
  title: string,
  body: string,
  baseBranch = "main"
): Promise<{ number: number; url: string }> {
  const octokit = getOctokit();

  await DevinLogger.info(`Creating PR: ${title}`, {
    metadata: { branch, baseBranch },
  });

  try {
    const { data: pr } = await octokit.pulls.create({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      title,
      body,
      head: branch,
      base: baseBranch,
    });

    await DevinLogger.info(`PR created: #${pr.number}`, {
      metadata: { url: pr.html_url },
    });

    return {
      number: pr.number,
      url: pr.html_url,
    };
  } catch (error) {
    await DevinLogger.error("Failed to create PR", {
      error: error as Error,
      metadata: { branch, title },
    });
    throw error;
  }
}

/**
 * Get pull request details
 */
export async function getPullRequest(prNumber: number) {
  const octokit = getOctokit();

  try {
    const { data: pr } = await octokit.pulls.get({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      pull_number: prNumber,
    });

    return pr;
  } catch (error) {
    await DevinLogger.error(`Failed to get PR #${prNumber}`, {
      error: error as Error,
    });
    throw error;
  }
}

/**
 * Post a comment on a PR
 */
export async function postPRComment(
  prNumber: number,
  comment: string
): Promise<GitHubComment> {
  const octokit = getOctokit();

  await DevinLogger.info(`Posting comment to PR #${prNumber}`);

  try {
    const { data: commentData } = await octokit.issues.createComment({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      issue_number: prNumber,
      body: comment,
    });

    return commentData as GitHubComment;
  } catch (error) {
    await DevinLogger.error(`Failed to post comment to PR #${prNumber}`, {
      error: error as Error,
    });
    throw error;
  }
}

/**
 * Get all comments on a PR
 */
export async function getPRComments(
  prNumber: number
): Promise<GitHubComment[]> {
  const octokit = getOctokit();

  try {
    const { data: comments } = await octokit.issues.listComments({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      issue_number: prNumber,
      per_page: 100,
    });

    return comments as GitHubComment[];
  } catch (error) {
    await DevinLogger.error(`Failed to get comments for PR #${prNumber}`, {
      error: error as Error,
    });
    throw error;
  }
}

/**
 * Get latest bot comments (since a specific timestamp)
 */
export async function getLatestBotComments(
  prNumber: number,
  sinceTimestamp: string,
  botName?: string
): Promise<GitHubComment[]> {
  const comments = await getPRComments(prNumber);

  return comments.filter((comment) => {
    const isAfterTimestamp =
      new Date(comment.created_at) > new Date(sinceTimestamp);
    const isBot = comment.user.type === "Bot";
    const matchesBot = botName ? comment.user.login === botName : true;

    return isAfterTimestamp && isBot && matchesBot;
  });
}

// ============================================
// BOT COMMAND PARSING
// ============================================

/**
 * Parse bot commands from a string
 */
export function parseBotCommands(text: string): BotCommand[] {
  const lines = text.split("\n");
  const commands: BotCommand[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Vercel commands
    if (COMMAND_PATTERNS.vercel_deploy.test(trimmed)) {
      const match = trimmed.match(COMMAND_PATTERNS.vercel_deploy);
      commands.push({
        bot: "vercel",
        command: "deploy",
        params: match ? [match[1]] : [],
        rawCommand: trimmed,
      });
    } else if (COMMAND_PATTERNS.vercel_rollback.test(trimmed)) {
      commands.push({
        bot: "vercel",
        command: "rollback",
        rawCommand: trimmed,
      });
    } else if (COMMAND_PATTERNS.vercel_inspect.test(trimmed)) {
      commands.push({
        bot: "vercel",
        command: "inspect",
        rawCommand: trimmed,
      });
    }

    // Supabase commands
    else if (COMMAND_PATTERNS.supabase_migrate.test(trimmed)) {
      const match = trimmed.match(COMMAND_PATTERNS.supabase_migrate);
      commands.push({
        bot: "supabase",
        command: "migrate",
        params: match ? [match[1]] : [],
        rawCommand: trimmed,
      });
    } else if (COMMAND_PATTERNS.supabase_backup.test(trimmed)) {
      commands.push({
        bot: "supabase",
        command: "backup",
        rawCommand: trimmed,
      });
    } else if (COMMAND_PATTERNS.supabase_restore.test(trimmed)) {
      const match = trimmed.match(COMMAND_PATTERNS.supabase_restore);
      commands.push({
        bot: "supabase",
        command: "restore",
        params: match ? [match[1]] : [],
        rawCommand: trimmed,
      });
    }
  }

  return commands;
}

// ============================================
// BOT RESPONSE MONITORING
// ============================================

/**
 * Wait for bot response to a command
 */
export async function waitForBotResponse(
  prNumber: number,
  botName: string,
  commentTimestamp: string,
  timeoutMs = 300_000 // 5 minutes default
): Promise<BotResponse> {
  const startTime = Date.now();
  const pollInterval = 10_000; // Check every 10 seconds

  await DevinLogger.info(`Waiting for ${botName} response on PR #${prNumber}`, {
    metadata: { timeout: timeoutMs, pollInterval },
  });

  while (Date.now() - startTime < timeoutMs) {
    // Get latest bot comments
    const botComments = await getLatestBotComments(
      prNumber,
      commentTimestamp,
      botName
    );

    // Check if we have a response
    if (botComments.length > 0) {
      const latestComment = botComments[botComments.length - 1];

      // Parse response
      const response = parseBotResponse(botName, latestComment.body);

      await DevinLogger.info(`Received ${botName} response`, {
        metadata: { status: response.status, message: response.message },
      });

      return response;
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  // Timeout
  await DevinLogger.warn(
    `Timeout waiting for ${botName} response on PR #${prNumber}`
  );

  return {
    bot: botName,
    status: "timeout",
    message: `No response from ${botName} after ${timeoutMs}ms`,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Parse bot response from comment body
 */
function parseBotResponse(botName: string, commentBody: string): BotResponse {
  const lowerBody = commentBody.toLowerCase();

  // Check for success indicators
  const successPatterns = [
    /successfully deployed/i,
    /deployment.*complete/i,
    /migration.*applied/i,
    /backup.*created/i,
    /✅/,
    /✓/,
  ];

  // Check for failure indicators
  const failurePatterns = [/failed/i, /error/i, /❌/, /✗/, /unable to/i];

  const isSuccess = successPatterns.some((pattern) =>
    pattern.test(commentBody)
  );
  const isFailure = failurePatterns.some((pattern) =>
    pattern.test(commentBody)
  );

  // Extract URL if present
  const urlMatch = commentBody.match(/https?:\/\/[^\s)]+/);
  const url = urlMatch ? urlMatch[0] : undefined;

  return {
    bot: botName,
    status: isSuccess ? "success" : isFailure ? "failure" : "pending",
    message: commentBody.substring(0, 500), // First 500 chars
    url,
    timestamp: new Date().toISOString(),
  };
}

// ============================================
// HIGH-LEVEL BOT OPERATIONS
// ============================================

/**
 * Execute bot commands on a PR and wait for responses
 */
export async function executeBotCommands(
  prNumber: number,
  commands: BotCommand[],
  timeoutMs = 300_000
): Promise<Map<string, BotResponse>> {
  const responses = new Map<string, BotResponse>();

  // Post all commands in a single comment
  const commentBody = commands.map((cmd) => cmd.rawCommand).join("\n");
  const commentTimestamp = new Date().toISOString();

  await postPRComment(prNumber, commentBody);

  await DevinLogger.info(
    `Posted ${commands.length} bot command(s) to PR #${prNumber}`,
    {
      metadata: { commands: commands.map((c) => c.rawCommand) },
    }
  );

  // Wait for each bot to respond
  const uniqueBots = [...new Set(commands.map((cmd) => cmd.bot))];

  for (const bot of uniqueBots) {
    const botUsername = BOT_USERNAMES[bot as keyof typeof BOT_USERNAMES];
    if (!botUsername) continue;

    const response = await waitForBotResponse(
      prNumber,
      botUsername,
      commentTimestamp,
      timeoutMs
    );

    responses.set(bot, response);

    // Log to database
    const supabase = getTiqologyDb();
    await supabase.from("devin_logs").insert({
      level: response.status === "success" ? "info" : "error",
      agent: "devin-builder",
      message: `Bot response from ${bot}: ${response.status}`,
      metadata: {
        pr_number: prNumber,
        bot,
        status: response.status,
        message: response.message,
        url: response.url,
      },
    });
  }

  return responses;
}

// ============================================
// EXPORTS
// ============================================

export const GitHubOps = {
  createPullRequest,
  getPullRequest,
  postPRComment,
  getPRComments,
  parseBotCommands,
  executeBotCommands,
  waitForBotResponse,
};

export default GitHubOps;
