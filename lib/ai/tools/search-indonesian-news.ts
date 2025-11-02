import { tool } from "ai";
import { z } from "zod";

// Major Indonesian news websites
const INDONESIAN_NEWS_SITES = [
  "detik.com",
  "kompas.com",
  "tribunnews.com",
  "tempo.co",
  "cnnindonesia.com",
  "liputan6.com",
];

export const searchIndonesianNews = tool({
  description: `Format a search query to find news from Indonesian news sites (${INDONESIAN_NEWS_SITES.join(", ")}). IMPORTANT: After calling this tool, you MUST call google_search tool with the formattedQuery from this tool's result. The google_search tool will return URLs. Then call url_context tool with those URLs to get article content.`,
  parameters: z.object({
    query: z
      .string()
      .describe(
        "The search query for Indonesian news. Can be in Indonesian or English."
      ),
  }),
  execute: (input: { query: string }) => {
    const query = "query" in input ? input.query : "";
    // Build search query with site: operators for Indonesian news sites
    const siteFilters = INDONESIAN_NEWS_SITES.map(
      (site) => `site:${site}`
    ).join(" OR ");
    const formattedQuery = `${query} (${siteFilters})`;

    return Promise.resolve({
      success: true,
      formattedQuery,
      originalQuery: query,
      newsSites: INDONESIAN_NEWS_SITES,
      instructions: [
        `Step 1: Call google_search tool with this exact query: "${formattedQuery}"`,
        "Step 2: From the google_search results, extract the URLs of the top 3-5 news articles",
        "Step 3: Call url_context tool with those URLs to fetch and summarize the article content",
        "Step 4: Provide a summary of the news articles in the user's language",
      ].join("\n"),
    });
  },
} as any);
