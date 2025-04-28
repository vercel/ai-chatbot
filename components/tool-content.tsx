'use client';

import React, { memo, useEffect } from 'react';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

interface ToolContentProps {
  state: 'call' | 'result';
  toolName: string;
  result?: any;
  args?: any;
  isLoading?: boolean;
}

const variants = {
  collapsed: {
    height: 0,
    opacity: 0,
  },
  expanded: {
    height: 'auto',
    opacity: 1,
  },
};

function PureToolContentCall({
  state,
  toolName,
  result,
  args,
  isLoading,
}: ToolContentProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (result && !isLoading) {
      setTimeout(() => {
        setIsExpanded(false);
      }, 1000);
    }
  }, [result, isLoading]);

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader
        className={'flex flex-row items-center justify-between space-y-0'}
      >
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <span className="font-mono">{toolName}</span>
        </CardTitle>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="rounded-full p-1 hover:bg-muted"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </CardHeader>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            key="content"
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={variants}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <CardContent>
              <div className="space-y-2">
                <div className="rounded-md bg-muted p-3">
                  <div className="text-xs text-muted-foreground mb-1 text-bold">
                    Request
                  </div>
                  <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                    {formatJSON(args)}
                  </pre>
                </div>
                {state === 'result' && (
                  <div className={cn('rounded-md bg-muted p-3')}>
                    <div className="text-xs text-muted-foreground mb-1">
                      Response
                    </div>
                    <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                      {formatToolContent(result)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function formatJSON(jsonString: string) {
  try {
    return JSON.stringify(jsonString, null, 2);
  } catch (e) {
    return jsonString;
  }
}

function formatToolContent(result?: any) {
  if (result && typeof result === 'object') {
    if (result.content) {
      if (typeof result.content === 'object') {
        if (Array.isArray(result.content)) {
          return result.content.map((item: any) => {
            if (item.type && item.type === 'text') {
              return item.text;
            } else {
              return JSON.stringify(item, null, 2);
            }
          });
        } else {
          return JSON.stringify(result.content, null, 2);
        }
      } else if (typeof result.content === 'string') {
        return result.content;
      } else {
        return 'Unknwown content type';
      }
    } else {
      return JSON.stringify(result, null, 2);
    }
  }

  return '';
}

export const ToolContentCall = memo(PureToolContentCall, (prev, next) => {
  if (prev.isLoading !== next.isLoading) return false;
  if (prev.state !== next.state) return false;
  if (prev.toolName !== next.toolName) return false;
  if (prev.result !== next.result) return false;
  if (prev.args !== next.args) return false;

  return true;
});
