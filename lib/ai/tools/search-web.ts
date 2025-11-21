/**
 * Web Search Tool
 *
 * **Optional Service** - This tool uses Tavily API to search the web for current information.
 * The tool is completely optional and the AI will gracefully handle its absence.
 *
 * If TAVILY_API_KEY is not configured:
 * - The tool will return an error message
 * - The AI will inform users that web search is unavailable
 * - All other chat functionality continues to work normally
 *
 * To enable web search:
 * 1. Get an API key from https://tavily.com
 * 2. Add TAVILY_API_KEY to your .env.local file
 *
 * @see https://docs.tavily.com for API documentation
 */

import { tavily } from "@tavily/core";
import { tool } from "ai";
import { z } from "zod";

const DEBUG = process.env.DEBUG === "true";
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

if (DEBUG) {
  if (TAVILY_API_KEY) {
    console.log("[searchWeb] Tavily web search enabled");
  } else {
    console.log(
      "[searchWeb] TAVILY_API_KEY not configured - web search will be unavailable"
    );
  }
}

const tavilyClient = TAVILY_API_KEY ? tavily({ apiKey: TAVILY_API_KEY }) : null;

export const searchWeb = tool({
  description:
    "Search the web for current information, facts, news, or any information not in your knowledge base. Use this when you need up-to-date information from the internet. Tavily provides AI-optimized search results with clean, relevant content.",
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        "Search query to find information on the web (e.g., 'latest news about AI', 'how to make sourdough bread', 'current weather in Tokyo')"
      ),
    searchDepth: z
      .enum(["basic", "advanced"])
      .optional()
      .default("basic")
      .describe(
        "Search depth: 'basic' for quick results, 'advanced' for more comprehensive search"
      ),
    includeAnswer: z
      .boolean()
      .optional()
      .default(true)
      .describe(
        "Whether to include an AI-generated answer summary based on search results"
      ),
    maxResults: z
      .number()
      .min(1)
      .max(10)
      .optional()
      .default(5)
      .describe("Maximum number of search results to return (1-10)"),
  }),
  execute: async ({ query, searchDepth, includeAnswer, maxResults }) => {
    // Gracefully handle missing API key
    if (!tavilyClient) {
      if (DEBUG) {
        console.log("[searchWeb] Request attempted without API key configured");
      }
      return {
        query,
        error:
          "Web search is not available. The administrator has not configured the TAVILY_API_KEY. Please ask me something from my existing knowledge instead.",
        results: [],
      };
    }

    try {
      const response = await tavilyClient.search(query, {
        searchDepth: searchDepth || "basic",
        maxResults: maxResults || 5,
        includeAnswer: includeAnswer !== false,
        includeRawContent: false,
      });

      if (!response || !response.results || response.results.length === 0) {
        return {
          query,
          error: "No search results found. Try rephrasing your query.",
        };
      }

      return {
        query: response.query || query,
        answer: response.answer || null,
        results: response.results.map((result) => ({
          title: result.title,
          url: result.url,
          content: result.content,
          score: result.score,
        })),
        images: response.images || [],
        responseTime: response.responseTime || null,
      };
    } catch (error) {
      console.error("[searchWeb] Tavily API error:", error);

      if (error instanceof Error) {
        return {
          query,
          error: `Web search failed: ${error.message}. Please try rephrasing your question or ask me something from my existing knowledge.`,
          results: [],
        };
      }

      return {
        query,
        error:
          "An unexpected error occurred while searching the web. Please try again or ask me something from my existing knowledge.",
        results: [],
      };
    }
  },
});
