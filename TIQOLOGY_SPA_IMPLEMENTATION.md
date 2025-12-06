# TiQology-spa Ghost Lab Implementation Guide

This document provides the complete implementation for adding Ghost Lab to TiQology-spa.

## Files to Create

### 1. Configuration File: `src/config/ghost.ts`

```typescript
/**
 * Ghost Mode API Configuration
 * 
 * This configures the connection to the ai-chatbot Ghost Mode API endpoint.
 */

export const ghostConfig = {
  // Ghost Mode API endpoint
  // Update this after deploying ai-chatbot to Vercel
  apiUrl: process.env.NEXT_PUBLIC_GHOST_API_URL || 'http://localhost:3000/api/ghost',
  
  // API key for authentication
  // Set this in .env.local
  apiKey: process.env.NEXT_PUBLIC_GHOST_MODE_API_KEY || '',
  
  // Default model to use
  defaultModel: 'chat-model' as const,
  
  // Timeout for API requests (ms)
  timeout: 30000,
};

export type GhostModel = 'chat-model' | 'chat-model-reasoning';

export interface GhostEvalRequest {
  prompt: string;
  context?: Record<string, unknown>;
  model?: GhostModel;
}

export interface GhostEvalResponse {
  score: number;
  feedback: string;
  result: string;
  timestamp: string;
  model: string;
}

export interface GhostError {
  error: string;
  message?: string;
}
```

### 2. API Client: `src/lib/ghost-client.ts`

```typescript
import { ghostConfig, GhostEvalRequest, GhostEvalResponse, GhostError } from '@/config/ghost';

/**
 * Ghost Mode API Client
 * 
 * Handles communication with the ai-chatbot Ghost Mode API.
 */
export class GhostClient {
  private apiUrl: string;
  private apiKey: string;
  private timeout: number;

  constructor(config = ghostConfig) {
    this.apiUrl = config.apiUrl;
    this.apiKey = config.apiKey;
    this.timeout = config.timeout;
  }

  /**
   * Evaluate text using Ghost Mode API
   */
  async evaluate(request: GhostEvalRequest): Promise<GhostEvalResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Add API key if configured
      if (this.apiKey) {
        headers['x-api-key'] = this.apiKey;
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData: GhostError = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data: GhostEvalResponse = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - Ghost API took too long to respond');
        }
        throw error;
      }
      throw new Error('Unknown error communicating with Ghost API');
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Health check for Ghost Mode API
   */
  async healthCheck(): Promise<{ status: string; service: string; version: string }> {
    const response = await fetch(this.apiUrl, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    return response.json();
  }
}

// Default export for convenience
export const ghostClient = new GhostClient();
```

### 3. React Hook: `src/hooks/use-ghost-eval.ts`

```typescript
'use client';

import { useState, useCallback } from 'react';
import { GhostClient } from '@/lib/ghost-client';
import type { GhostEvalRequest, GhostEvalResponse } from '@/config/ghost';

const ghostClient = new GhostClient();

export interface UseGhostEvalReturn {
  evaluate: (request: GhostEvalRequest) => Promise<GhostEvalResponse>;
  isLoading: boolean;
  error: string | null;
  lastResult: GhostEvalResponse | null;
}

/**
 * React hook for Ghost Mode evaluations
 * 
 * @example
 * ```tsx
 * const { evaluate, isLoading, error, lastResult } = useGhostEval();
 * 
 * const handleEvaluate = async () => {
 *   try {
 *     const result = await evaluate({
 *       prompt: "Is this valid?",
 *       context: { source: "GhostLab" }
 *     });
 *     console.log(`Score: ${result.score}/100`);
 *   } catch (err) {
 *     console.error("Evaluation failed:", err);
 *   }
 * };
 * ```
 */
export function useGhostEval(): UseGhostEvalReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<GhostEvalResponse | null>(null);

  const evaluate = useCallback(async (request: GhostEvalRequest): Promise<GhostEvalResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await ghostClient.evaluate(request);
      setLastResult(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    evaluate,
    isLoading,
    error,
    lastResult,
  };
}
```

### 4. Ghost Lab Page: `src/app/ghost-lab/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useGhostEval } from '@/hooks/use-ghost-eval';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export default function GhostLabPage() {
  const [inputText, setInputText] = useState('');
  const { evaluate, isLoading, error, lastResult } = useGhostEval();

  const handleEvaluate = async () => {
    if (!inputText.trim()) {
      return;
    }

    try {
      await evaluate({
        prompt: inputText,
        context: {
          source: 'TiQology',
          module: 'GhostLab',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      // Error is already set by the hook
      console.error('Evaluation error:', err);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-purple-500" />
          Ghost Lab
        </h1>
        <p className="text-muted-foreground">
          AI-powered evaluation powered by the Ghost Mode API. Enter any text to receive a quality score and feedback.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Text to Evaluate</CardTitle>
            <CardDescription>
              Enter any text, question, or content you want Ghost to evaluate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Example: Is this a professional email address: john.doe@company.com?"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <Button
              onClick={handleEvaluate}
              disabled={isLoading || !inputText.trim()}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Evaluating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Evaluate with Ghost
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Evaluation Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Results Section */}
        {lastResult && (
          <Card className="border-2 border-purple-200 dark:border-purple-900">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Evaluation Results
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {new Date(lastResult.timestamp).toLocaleString()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Score Display */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-bold">{lastResult.score}</span>
                    <span className="text-2xl text-muted-foreground">/100</span>
                  </div>
                  <Badge className={getScoreColor(lastResult.score)}>
                    {getScoreLabel(lastResult.score)}
                  </Badge>
                </div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getScoreColor(lastResult.score)} transition-all duration-500`}
                      style={{ width: `${lastResult.score}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Feedback */}
              <div>
                <h3 className="font-semibold mb-2">Feedback</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {lastResult.feedback}
                </p>
              </div>

              {/* Full Response (Expandable) */}
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                  View Full Response
                </summary>
                <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-x-auto">
                  {lastResult.result}
                </pre>
              </details>

              {/* Model Info */}
              <div className="text-xs text-muted-foreground border-t pt-4">
                Model: <code className="bg-muted px-1 py-0.5 rounded">{lastResult.model}</code>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        {!lastResult && !error && (
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Sparkles className="w-5 h-5 text-purple-500 mt-1 flex-shrink-0" />
                <div className="space-y-2">
                  <h3 className="font-semibold">How Ghost Lab Works</h3>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Enter any text or question you want evaluated</li>
                    <li>Ghost analyzes it using advanced AI models</li>
                    <li>Receive a score (0-100) and constructive feedback</li>
                    <li>Results are instant - no login or history required</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
```

### 5. Environment Configuration: `.env.local` (add these lines)

```bash
# Ghost Mode API Configuration
NEXT_PUBLIC_GHOST_API_URL=http://localhost:3000/api/ghost
NEXT_PUBLIC_GHOST_MODE_API_KEY=your-secret-key-here
```

### 6. Environment Example: `.env.example` (add these lines)

```bash
# Ghost Mode API Configuration
# Update NEXT_PUBLIC_GHOST_API_URL after deploying ai-chatbot to Vercel
NEXT_PUBLIC_GHOST_API_URL=https://your-ai-console.vercel.app/api/ghost
NEXT_PUBLIC_GHOST_MODE_API_KEY=your-secret-key-here
```

## Navigation Integration

### Option A: If using App Router with layout navigation

Add to your main navigation component (e.g., `src/components/navigation.tsx` or `src/app/layout.tsx`):

```tsx
import { Sparkles } from 'lucide-react';

// Add to your navigation links array:
const navLinks = [
  // ... existing links
  {
    href: '/ghost-lab',
    label: 'Ghost Lab',
    icon: Sparkles,
    description: 'AI Evaluation Tool'
  },
];
```

### Option B: If using a sidebar/dashboard layout

Add to your sidebar items:

```tsx
<SidebarItem href="/ghost-lab" icon={Sparkles}>
  Ghost Lab
</SidebarItem>
```

### Option C: If you have a tools/dev section

Add a card or tile:

```tsx
<Link href="/ghost-lab">
  <Card className="hover:border-purple-500 transition-colors cursor-pointer">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Sparkles className="w-5 h-5" />
        Ghost Lab
      </CardTitle>
      <CardDescription>
        AI-powered text evaluation and scoring
      </CardDescription>
    </CardHeader>
  </Card>
</Link>
```

## Testing

### Local Testing (ai-chatbot and TiQology-spa both running)

1. **Terminal 1 - Start ai-chatbot:**
   ```bash
   cd /path/to/ai-chatbot
   pnpm dev
   # Runs on http://localhost:3000
   ```

2. **Terminal 2 - Start TiQology-spa:**
   ```bash
   cd /path/to/TiQology-spa
   npm run dev  # or pnpm dev
   # Runs on http://localhost:3001 (or next available port)
   ```

3. **Test the integration:**
   - Open http://localhost:3001/ghost-lab
   - Enter test text: "Is this email valid: test@example.com?"
   - Click "Evaluate with Ghost"
   - Verify you receive a score and feedback

### Production Testing (after Vercel deployment)

1. **Update `.env.local` in TiQology-spa:**
   ```bash
   NEXT_PUBLIC_GHOST_API_URL=https://your-ai-console.vercel.app/api/ghost
   ```

2. **Redeploy TiQology-spa** to pick up the new environment variable

3. **Test the production integration:**
   - Visit your deployed TiQology-spa URL
   - Navigate to Ghost Lab
   - Verify evaluations work against the production API

## Troubleshooting

### "Failed to fetch" Error

**Problem**: Cannot connect to Ghost API

**Solutions**:
- Check that `NEXT_PUBLIC_GHOST_API_URL` is correct
- Verify ai-chatbot is running (if local)
- Check browser console for CORS errors
- Verify API key is correct if using authentication

### 401 Unauthorized Error

**Problem**: API key mismatch

**Solutions**:
- Verify `NEXT_PUBLIC_GHOST_MODE_API_KEY` matches `GHOST_MODE_API_KEY` in ai-chatbot
- Check that the key is being sent in requests (browser DevTools → Network tab)

### Timeout Errors

**Problem**: Request takes too long

**Solutions**:
- Check ai-chatbot logs for errors
- Verify `GOOGLE_GENERATIVE_AI_API_KEY` is set in ai-chatbot
- Increase timeout in `src/config/ghost.ts`

## API Contract Reference

### Request Format
```typescript
POST /api/ghost
Content-Type: application/json
x-api-key: your-secret-key

{
  "prompt": "text to evaluate",
  "context": {
    "source": "TiQology",
    "module": "GhostLab"
  },
  "model": "chat-model"  // or "chat-model-reasoning"
}
```

### Response Format
```typescript
{
  "score": 85,
  "feedback": "Brief evaluation summary",
  "result": "Full AI response text",
  "timestamp": "2024-12-06T10:00:00.000Z",
  "model": "chat-model"
}
```

### Error Format
```typescript
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

## Next Steps

1. Copy all files above into TiQology-spa
2. Install required dependencies (if not already present):
   ```bash
   npm install lucide-react
   # Verify you have @/components/ui components (shadcn/ui)
   ```
3. Update navigation to include Ghost Lab link
4. Test locally with both apps running
5. Deploy ai-chatbot to Vercel
6. Update TiQology-spa environment variables
7. Deploy TiQology-spa
8. Test production integration

## Future Enhancements

- [ ] Batch evaluation mode (multiple texts at once)
- [ ] History/saved evaluations
- [ ] Export results as PDF/CSV
- [ ] Custom evaluation criteria/templates
- [ ] Real-time collaboration (multiple users)
- [ ] Webhook notifications for async evaluations
