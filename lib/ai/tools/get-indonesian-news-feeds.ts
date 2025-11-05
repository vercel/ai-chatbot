import { tool } from "ai";
import { XMLParser } from "fast-xml-parser";
import { z } from "zod";

export type FeedReliability = "green" | "yellow";

export type FeedDef = {
  id: string;
  name: string;
  url: string;
  reliability: FeedReliability;
};

export const FEEDS: FeedDef[] = [
  {
    id: "kompas",
    name: "Kompas",
    url: "https://rss.kompas.com/",
    reliability: "green",
  },
  {
    id: "detik",
    name: "detikcom",
    url: "https://rss.detik.com/",
    reliability: "green",
  },
  {
    id: "antara-en",
    name: "ANTARA (EN)",
    url: "https://en.antaranews.com/rss",
    reliability: "green",
  },
  {
    id: "okezone",
    name: "Okezone",
    url: "https://sindikasi.okezone.com/",
    reliability: "green",
  },
  {
    id: "tribunnews",
    name: "Tribunnews",
    url: "https://www.tribunnews.com/rss",
    reliability: "green",
  },
  {
    id: "sindonews",
    name: "SINDOnews",
    url: "https://www.sindonews.com/feed",
    reliability: "green",
  },
  {
    id: "indoleft",
    name: "Indoleft",
    url: "https://www.indoleft.org/rss.php",
    reliability: "green",
  },
  {
    id: "balitimes",
    name: "The Bali Times",
    url: "https://thebalitimes.com/feed",
    reliability: "green",
  },
  {
    id: "online24jam",
    name: "Online24jam",
    url: "https://online24jam.com/feed",
    reliability: "green",
  },
  {
    id: "fajar",
    name: "Fajar",
    url: "https://fajar.co.id/feed",
    reliability: "green",
  },
  {
    id: "waspada",
    name: "Waspada",
    url: "https://waspada.co.id/feed",
    reliability: "green",
  },
  {
    id: "jpnn",
    name: "JPNN",
    url: "https://www.jpnn.com/index.php?mib=rss",
    reliability: "green",
  },
  {
    id: "gv-indonesia",
    name: "Global Voices (Indonesia)",
    url: "https://globalvoices.org/-/world/indonesia/feed/",
    reliability: "green",
  },
  {
    id: "tempo",
    name: "Tempo",
    url: "https://rss.tempo.co/",
    reliability: "yellow",
  },
  {
    id: "beritasatu",
    name: "BeritaSatu",
    url: "https://www.beritasatu.com/rss",
    reliability: "yellow",
  },
  {
    id: "mediaindo",
    name: "Media Indonesia",
    url: "https://mediaindonesia.com/feed",
    reliability: "yellow",
  },
  {
    id: "idnewsnet",
    name: "IndonesiaNews.Net",
    url: "https://www.indonesianews.net/rss",
    reliability: "yellow",
  },
  {
    id: "viva",
    name: "VIVA",
    url: "https://www.viva.co.id/get/all",
    reliability: "yellow",
  },
];

export const FEEDS_BY_ID: Record<string, FeedDef> = Object.fromEntries(
  FEEDS.map((feed) => [feed.id, feed])
);

const DEFAULT_FEED_LIMIT = 8;
const MAX_FEED_LIMIT = 10;
const DEFAULT_ITEMS_PER_FEED = 3;
const MAX_ITEMS_PER_FEED = 5;
const FETCH_TIMEOUT_MS = 8000;
const DEFAULT_INSTRUCTIONS =
  "Summarize key developments from the fetched Indonesian headlines. Cite feed sources by name and URL. If important topics are missing, fall back to google_search + url_context.";

type FeedArticle = {
  title?: string;
  link?: string;
  summary?: string;
  publishedAt?: string;
};

type FeedResult = {
  feed: FeedDef;
  fetchedAt: string;
  articles: FeedArticle[];
};

type FeedError = {
  feed: FeedDef | null;
  message: string;
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  textNodeName: "text",
  removeNSPrefix: true,
  trimValues: true,
});

const toArray = <T>(value: T | T[] | undefined): T[] => {
  if (Array.isArray(value)) {
    return value;
  }
  if (value === undefined) {
    return [];
  }
  return [value];
};

const getText = (value: unknown): string | undefined => {
  if (Array.isArray(value)) {
    for (const item of value) {
      const text = getText(item);
      if (text) {
        return text;
      }
    }
    return;
  }
  if (typeof value === "string") {
    return value.trim();
  }
  if (value && typeof value === "object") {
    if (
      "text" in value &&
      typeof (value as { text: unknown }).text === "string"
    ) {
      return (value as { text: string }).text.trim();
    }
    if (
      "#text" in value &&
      typeof (value as { "#text": unknown })["#text"] === "string"
    ) {
      return (value as { "#text": string })["#text"].trim();
    }
    if (
      "href" in value &&
      typeof (value as { href: unknown }).href === "string"
    ) {
      return (value as { href: string }).href.trim();
    }
    if (
      "@_href" in value &&
      typeof (value as { "@_href": unknown })["@_href"] === "string"
    ) {
      return (value as { "@_href": string })["@_href"].trim();
    }
  }
};

const stripHtml = (value: string): string =>
  value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const truncate = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 1).trim()}…`;
};

const parseDate = (value: string | undefined): string | undefined => {
  if (!value) {
    return;
  }
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return;
  }
  return new Date(timestamp).toISOString();
};

const normalizeArticles = (
  xml: string,
  itemsPerFeed: number
): FeedArticle[] => {
  const parsed = parser.parse(xml) as Record<string, unknown>;

  const rssChannel =
    parsed && typeof parsed === "object" && "rss" in parsed
      ? (parsed.rss as {
          channel?: {
            item?: Record<string, unknown> | Record<string, unknown>[];
          };
        })
      : undefined;
  const rssItems = rssChannel?.channel?.item;

  const atomFeed =
    parsed && typeof parsed === "object" && "feed" in parsed
      ? (parsed.feed as {
          entry?: Record<string, unknown> | Record<string, unknown>[];
        })
      : undefined;
  const atomEntries = atomFeed?.entry;

  const rawEntries = rssItems ? toArray(rssItems) : toArray(atomEntries);

  const articles: FeedArticle[] = [];

  for (const entry of rawEntries) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const entryRecord = entry as Record<string, unknown>;
    const title = getText(entryRecord.title);
    const rawLink = entryRecord.link;
    let link: string | undefined = getText(rawLink);
    if (!link && rawLink && typeof rawLink === "object") {
      if (Array.isArray(rawLink)) {
        for (const candidate of rawLink) {
          const candidateText = getText(candidate);
          if (candidateText) {
            link = candidateText;
            break;
          }
        }
      } else if (
        "href" in rawLink &&
        typeof (rawLink as { href?: unknown }).href === "string"
      ) {
        link = (rawLink as { href: string }).href;
      } else if (
        "@_href" in rawLink &&
        typeof (rawLink as { "@_href"?: unknown })["@_href"] === "string"
      ) {
        link = (rawLink as { "@_href": string })["@_href"];
      }
    }
    const description =
      getText(entryRecord.description) ??
      getText(entryRecord.summary) ??
      getText(entryRecord.content) ??
      getText((entryRecord.content as { encoded?: string })?.encoded);
    const publishedAt =
      parseDate(getText(entryRecord.pubDate)) ??
      parseDate(getText(entryRecord.published)) ??
      parseDate(getText(entryRecord.updated));

    const normalizedDescription = description
      ? truncate(stripHtml(description), 320)
      : undefined;

    articles.push({
      title,
      link,
      summary: normalizedDescription,
      publishedAt,
    });

    if (articles.length >= itemsPerFeed) {
      break;
    }
  }

  return articles;
};

const fetchWithTimeout = async (
  feed: FeedDef,
  itemsPerFeed: number
): Promise<FeedResult> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(feed.url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "UltraciteNewsBot/1.0 (+https://cursor.sh)",
        Accept:
          "application/rss+xml, application/atom+xml, application/xml;q=0.9, */*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const xml = await response.text();
    const articles = normalizeArticles(xml, itemsPerFeed);

    return {
      feed,
      fetchedAt: new Date().toISOString(),
      articles,
    };
  } finally {
    clearTimeout(timeoutId);
  }
};

const toolSchema = z.object({
  limitFeeds: z
    .number()
    .int()
    .min(1)
    .max(MAX_FEED_LIMIT)
    .optional()
    .describe("Maximum number of feeds to fetch. Defaults to 8."),
  itemsPerFeed: z
    .number()
    .int()
    .min(1)
    .max(MAX_ITEMS_PER_FEED)
    .optional()
    .describe("Maximum number of articles per feed. Defaults to 3."),
  includeYellow: z
    .boolean()
    .optional()
    .describe(
      "Whether to include lower reliability (yellow) feeds. Defaults to false."
    ),
});

type ToolInput = z.infer<typeof toolSchema>;

const selectFeeds = (input: ToolInput | undefined): FeedDef[] => {
  const limit = input?.limitFeeds ?? DEFAULT_FEED_LIMIT;
  const includeYellow = input?.includeYellow ?? false;

  const selected: FeedDef[] = [];

  for (const feed of FEEDS) {
    if (!includeYellow && feed.reliability === "yellow") {
      continue;
    }
    selected.push(feed);
    if (selected.length >= limit) {
      break;
    }
  }

  return selected;
};

export const getIndonesianNewsFeeds = tool({
  description:
    "Fetches the latest Indonesian news headlines from curated RSS feeds (Kompas, Detik, Tribunnews, etc.). Use this to gather up-to-date context before summarizing news. Handles partial failures gracefully.",
  parameters: toolSchema,
  execute: async (input: ToolInput) => {
    const itemsPerFeed = input?.itemsPerFeed ?? DEFAULT_ITEMS_PER_FEED;
    const feedsToFetch = selectFeeds(input);

    if (feedsToFetch.length === 0) {
      return {
        success: false,
        feeds: [] as FeedResult[],
        errors: [{ message: "No feeds selected", feed: null }],
        requestedFeeds: [],
        itemsPerFeed,
        instructions: DEFAULT_INSTRUCTIONS,
      };
    }

    const settledResults = await Promise.allSettled(
      feedsToFetch.map((feed) => fetchWithTimeout(feed, itemsPerFeed))
    );

    const feeds: FeedResult[] = [];
    const errors: FeedError[] = [];

    for (let index = 0; index < settledResults.length; index += 1) {
      const result = settledResults[index];
      const feedDef = feedsToFetch[index];

      if (result.status === "fulfilled") {
        feeds.push(result.value);
        continue;
      }

      errors.push({
        feed: feedDef,
        message:
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason),
      });
    }

    return {
      success: feeds.length > 0,
      feeds,
      errors: errors.length > 0 ? errors : undefined,
      requestedFeeds: feedsToFetch.map((feed) => feed.id),
      itemsPerFeed,
      instructions: DEFAULT_INSTRUCTIONS,
    };
  },
} as any);
