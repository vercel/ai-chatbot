'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Loader2, Globe, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface DomainResult {
  domain: string;
  available: boolean;
  error?: string;
}

interface DomainCheckerProps {
  results?: DomainResult[];
  loading?: boolean;
}

export function DomainChecker({ results = [], loading = false }: DomainCheckerProps) {
  const [animatedResults, setAnimatedResults] = useState<DomainResult[]>([]);

  useEffect(() => {
    if (results.length > 0) {
      setAnimatedResults([]);
      const timer = setTimeout(() => {
        results.forEach((result, index) => {
          setTimeout(() => {
            setAnimatedResults(prev => [...prev, result]);
          }, index * 100);
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [results]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Checking domain availability...</p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return null;
  }

  const availableCount = results.filter(r => r.available).length;
  const takenCount = results.filter(r => !r.available && !r.error).length;

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Domain Availability Check</h3>
      </div>

      {availableCount > 0 || takenCount > 0 ? (
        <div className="flex gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span className="text-muted-foreground">
              {availableCount} available
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <span className="text-muted-foreground">
              {takenCount} taken
            </span>
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {animatedResults.map((result, index) => (
            <motion.div
              key={result.domain}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ 
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1]
              }}
            >
              <DomainCard result={result} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function DomainCard({ result }: { result: DomainResult }) {
  const [isHovered, setIsHovered] = useState(false);

  if (result.error) {
    return (
      <div className="relative overflow-hidden rounded-lg border border-destructive/20 bg-destructive/5 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-mono text-sm font-medium">{result.domain}</p>
              <p className="text-xs text-destructive mt-1">{result.error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isAvailable = result.available;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border transition-all duration-200",
        isAvailable 
          ? "border-green-500/20 bg-gradient-to-r from-green-500/5 to-green-500/10 hover:border-green-500/40" 
          : "border-red-500/20 bg-gradient-to-r from-red-500/5 to-red-500/10 hover:border-red-500/40"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isAvailable ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <div>
              <p className="font-mono text-sm font-medium">{result.domain}</p>
              <p className={cn(
                "text-xs mt-1",
                isAvailable ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}>
                {isAvailable ? "Available for registration" : "Already registered"}
              </p>
            </div>
          </div>
          
          {isAvailable && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => window.open(`https://vercel.com/domains?q=${result.domain}`, '_blank')}
              >
                Register
                <ExternalLink className="h-3 w-3" />
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {isAvailable && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/10 to-green-500/0"
          initial={{ x: '-100%' }}
          animate={{ x: isHovered ? '100%' : '-100%' }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
      )}
    </div>
  );
}