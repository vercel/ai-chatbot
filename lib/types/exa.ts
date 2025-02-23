// lib/types/exa.ts
export type SearchType = 'keyword' | 'neural' | 'auto';
export type Category = 
  | 'company' 
  | 'research paper'
  | 'news'
  | 'pdf'
  | 'github'
  | 'tweet'
  | 'personal site'
  | 'linkedin profile'
  | 'financial report';

export type LivecrawlOption = 'never' | 'fallback' | 'always' | 'auto';

export interface TextContentsOptions {
  maxCharacters?: number;
  includeHtmlTags?: boolean;
}

export interface HighlightsContentsOptions {
  numSentences?: number;
  highlightsPerUrl?: number;
  query?: string;
}

export interface SummaryContentsOptions {
  query?: string;
}

export interface ExtrasOptions {
  links?: number;
  imageLinks?: number;
}

export interface ContentOptions {
  text?: true | TextContentsOptions;
  highlights?: true | HighlightsContentsOptions;
  summary?: true | SummaryContentsOptions;
  livecrawl?: LivecrawlOption;
  livecrawlTimeout?: number;
  subpages?: number;
  subpageTarget?: string | string[];
  extras?: ExtrasOptions;
}

export interface CommonRequestOptions {
  numResults?: number;
  includeDomains?: string[];
  excludeDomains?: string[];
  startCrawlDate?: string;
  endCrawlDate?: string;
  startPublishedDate?: string;
  endPublishedDate?: string;
  includeText?: string[];
  excludeText?: string[];
  contents?: ContentOptions;
}

export interface SearchResult {
  title: string;
  url: string;
  publishedDate?: string;
  author?: string;
  score?: number;
  id: string;
  image?: string;
  favicon?: string;
}

export interface ResultWithContent extends SearchResult {
  text?: string;
  highlights?: string[];
  highlightScores?: number[];
  summary?: string;
  subpages?: ResultWithContent[];
  extras?: {
    links?: string[];
  };
}

export interface SearchResponse {
  requestId: string;
  autopromptString?: string;
  autoDate?: string;
  resolvedSearchType: 'neural' | 'keyword';
  results: ResultWithContent[];
  searchType?: SearchType;
  costDollars: CostBreakdown;
}

export interface CostBreakdown {
  total: number;
  breakDown: {
    search?: number;
    contents?: number;
    breakdown?: {
      keywordSearch?: number;
      neuralSearch?: number;
      contentText?: number;
      contentHighlight?: number;
      contentSummary?: number;
    };
  }[];
  perRequestPrices: {
    neuralSearch_1_25_results: number;
    neuralSearch_26_100_results: number;
    neuralSearch_100_plus_results: number;
    keywordSearch_1_100_results: number;
    keywordSearch_100_plus_results: number;
  };
  perPagePrices: {
    contentText: number;
    contentHighlight: number;
    contentSummary: number;
  };
}

// Additional types for Exa.js client methods
export interface FindSimilarOptions extends CommonRequestOptions {
  // Add any specific options for findSimilar
}

export interface AnswerOptions {
  stream?: boolean;
  text?: boolean;
  model?: 'exa' | 'exa-pro';
}

export interface AnswerResponse {
  requestId: string;
  answer: string;
  sources?: ResultWithContent[];
  metadata?: {
    processingTime: number;
    promptTokens: number;
    completionTokens: number;
  };
  // Note: costDollars is optional in the actual API response
  costDollars?: CostBreakdown;
}

export interface SearchAndContentsOptions extends Omit<CommonRequestOptions, 'contents'> {
  type?: SearchType;
  category?: Category;
  useAutoprompt?: boolean;
  moderation?: boolean;
  // Content options are flattened at the top level for this endpoint
  text?: true | TextContentsOptions;
  highlights?: true | HighlightsContentsOptions;
  summary?: true | SummaryContentsOptions;
  livecrawl?: LivecrawlOption;
  livecrawlTimeout?: number;
  subpages?: number;
  subpageTarget?: string | string[];
  extras?: ExtrasOptions;
}

// The response is the same as SearchResponse since it includes content
export type SearchAndContentsResponse = SearchResponse;
