'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ChartProps {
  args?: {
    chartConfig?: any;
  };
  result?: {
    success: boolean;
    imageUrl?: string;
    error?: string;
    chartConfig?: any;
  };
}

export function Chart({ args, result }: ChartProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Show loading state when tool is being called
  if (!result) {
    return (
      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="size-4 bg-blue-500 rounded animate-pulse" />
          <div className="text-sm font-medium">Generating chart...</div>
        </div>
        <div className="w-full h-64 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  // Show error state
  if (!result.success || result.error) {
    return (
      <div className="border border-red-200 rounded-lg p-4 bg-red-50">
        <div className="flex items-center gap-2 mb-2">
          <div className="size-4 bg-red-500 rounded" />
          <div className="text-sm font-medium text-red-800">
            Chart Generation Failed
          </div>
        </div>
        <p className="text-sm text-red-600">
          {result.error || 'Unknown error occurred'}
        </p>
      </div>
    );
  }

  // Show success state with chart image
  return (
    <div className="border rounded-lg p-4 bg-background">
      <div className="flex items-center gap-2 mb-3">
        <div className="size-4 bg-green-500 rounded" />
        <div className="text-sm font-medium">Chart Generated</div>
      </div>

      <div className="relative">
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted rounded">
            <div className="animate-spin rounded-full size-8 border-b-2 border-primary" />
          </div>
        )}

        {imageError ? (
          <div className="w-full h-64 bg-muted rounded flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Failed to load chart image
            </p>
          </div>
        ) : (
          <img
            src={result.imageUrl}
            alt="Generated Chart"
            className={cn(
              'w-full max-w-2xl mx-auto rounded transition-opacity duration-200',
              imageLoading ? 'opacity-0' : 'opacity-100',
            )}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageLoading(false);
              setImageError(true);
            }}
          />
        )}
      </div>

      {result.chartConfig && (
        <details className="mt-4">
          <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
            View Chart Configuration
          </summary>
          <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto">
            {JSON.stringify(result.chartConfig, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
