'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Globe, Search, FileText, Clock, Link2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { SearchResponse, ResultWithContent } from '@/lib/types/exa';

// Common result display component for all search-like results
function ResultList({ results }: { results: ResultWithContent[] }) {
  return (
    <div className="space-y-4">
      {results.map((result: ResultWithContent) => (
        <div key={result.id} className="border rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {result.favicon && (
                  <img
                    src={result.favicon}
                    alt="Site favicon"
                    className="w-4 h-4"
                  />
                )}
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:underline"
                >
                  {result.title}
                </a>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  <span>{new URL(result.url).hostname}</span>
                </div>
                {result.publishedDate && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>
                      {new Date(result.publishedDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {result.score && (
                  <Badge variant="secondary">
                    Score: {result.score.toFixed(2)}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {result.highlights && result.highlights.length > 0 && (
            <div className="mt-3 space-y-2">
              {result.highlights.map((highlight, i) => (
                <div
                  key={i}
                  className="text-sm text-gray-600 bg-gray-50 p-2 rounded"
                >
                  "{highlight}"
                </div>
              ))}
            </div>
          )}

          {result.summary && (
            <div className="mt-3">
              <div className="text-sm font-medium text-gray-700">Summary</div>
              <p className="text-sm text-gray-600 mt-1">{result.summary}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

interface ExaSearchResultProps {
  title: string;
  response: SearchResponse;
}

export function ExaSearchResult({ title, response }: ExaSearchResultProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="w-full p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-500" />
          <h3 className="font-medium">{title}</h3>
          <Badge variant="secondary" className="ml-2">
            {response.results.length} results
          </Badge>
          {response.resolvedSearchType && (
            <Badge variant="outline" className="ml-2">
              {response.resolvedSearchType}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-auto"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {isExpanded && (
        <div className="space-y-4 mt-4">
          <ResultList results={response.results} />
          {response.costDollars && (
            <div className="text-xs text-gray-500 mt-2">
              Cost: ${response.costDollars.total.toFixed(4)}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export function ExaFindSimilarResult({ title, response }: ExaSearchResultProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="w-full p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-blue-500" />
          <h3 className="font-medium">{title}</h3>
          <Badge variant="secondary" className="ml-2">
            {response.results.length} similar pages
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-auto"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {isExpanded && (
        <div className="space-y-4 mt-4">
          <ResultList results={response.results} />
          {response.costDollars && (
            <div className="text-xs text-gray-500 mt-2">
              Cost: ${response.costDollars.total.toFixed(4)}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export function ExaGetContentsResult({ title, response }: ExaSearchResultProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="w-full p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-500" />
          <h3 className="font-medium">{title}</h3>
          <Badge variant="secondary" className="ml-2">
            {response.results.length} pages
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-auto"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {isExpanded && (
        <div className="space-y-4 mt-4">
          <ResultList results={response.results} />
          {response.costDollars && (
            <div className="text-xs text-gray-500 mt-2">
              Cost: ${response.costDollars.total.toFixed(4)}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

interface ExaAnswerResultProps {
  title: string;
  answer: string;
  sources?: ResultWithContent[];
}

export function ExaAnswerResult({ title, answer, sources }: ExaAnswerResultProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="w-full p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-500" />
          <h3 className="font-medium">{title}</h3>
          {sources && (
            <Badge variant="secondary" className="ml-2">
              {sources.length} sources
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-auto"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="text-sm text-gray-700">{answer}</div>

      {isExpanded && sources && sources.length > 0 && (
        <div className="space-y-4 mt-4">
          <div className="font-medium text-sm text-gray-700">Sources:</div>
          <ResultList results={sources} />
        </div>
      )}
    </Card>
  );
}
