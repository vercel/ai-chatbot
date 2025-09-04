'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Code2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CodeData {
  language: string;
  code: string;
  output: string;
}

interface CodeCardProps {
  data: CodeData;
}

export function CodeCard({ data }: CodeCardProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(data.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLanguageColor = (lang: string) => {
    const colors: Record<string, string> = {
      javascript: 'text-yellow-500',
      typescript: 'text-blue-500',
      python: 'text-green-500',
    };
    return colors[lang.toLowerCase()] || 'text-gray-500';
  };

  return (
    <Card className="w-full max-w-2xl overflow-hidden">
      <div className="border-b bg-muted/30 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 className={cn("h-4 w-4", getLanguageColor(data.language))} />
          <span className="text-sm font-medium capitalize">{data.language}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 px-2"
        >
          {copied ? (
            <Check className="h-3 w-3" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>
      
      <div className="p-4">
        <pre className="bg-muted/50 rounded p-3 overflow-x-auto">
          <code className="text-sm">{data.code}</code>
        </pre>
        
        {data.output && (
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2">Output:</p>
            <pre className="bg-green-50 dark:bg-green-900/20 rounded p-3 overflow-x-auto">
              <code className="text-sm text-green-800 dark:text-green-200">
                {data.output}
              </code>
            </pre>
          </div>
        )}
      </div>
    </Card>
  );
}