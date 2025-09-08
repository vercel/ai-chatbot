'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  React.useEffect(() => {
    // Log global errors
    console.error('Global Error:', error);
    
    // Report to error tracking service
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/errors/global', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          digest: error.digest,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      }).catch(console.error);
    }
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="max-w-md w-full text-center">
            <div className="flex justify-center mb-6">
              <AlertTriangle className="w-16 h-16 text-red-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Oops! Something went wrong
            </h1>
            
            <p className="text-muted-foreground mb-8">
              A critical error occurred that prevented the application from loading properly. 
              This is likely a temporary issue.
            </p>

            {process.env.NODE_ENV === 'development' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
                <h3 className="font-semibold text-red-800 mb-2">Debug Information:</h3>
                <div className="text-sm text-red-700 font-mono whitespace-pre-wrap overflow-auto max-h-32">
                  {error.message}
                  {error.digest && (
                    <>
                      {'\n\n'}
                      Error Digest: {error.digest}
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={reset} className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/'}
                className="flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Go Home
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={() => window.location.href = 'mailto:support@example.com'}
                className="flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Contact Support
              </Button>
            </div>

            <div className="mt-8 text-sm text-muted-foreground">
              <p>If this problem persists, please contact our support team.</p>
              {error.digest && (
                <p className="mt-1 font-mono text-xs">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}