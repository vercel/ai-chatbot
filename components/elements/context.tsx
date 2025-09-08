'use client';

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';
import type { LanguageModelUsage } from 'ai';
import { breakdownTokens, estimateCost, normalizeUsage } from 'tokenlens';
import { Separator } from '@/components/ui/separator';

export type ContextProps = ComponentProps<'button'> & {
  /** Total context window size in tokens */
  maxTokens: number;
  /** Tokens used so far */
  usedTokens: number;
  /** Optional full usage payload to enable breakdown view */
  usage?: LanguageModelUsage | undefined;
  /** Optional model id (canonical or alias) to compute cost */
  modelId?: string;
  /** Show token breakdown and optional cost inside hover */
  showBreakdown?: boolean;
};

const THOUSAND = 1000;
const MILLION = 1_000_000;
const BILLION = 1_000_000_000;
const PERCENT_MAX = 100;

// Lucide CircleIcon geometry
const ICON_VIEWBOX = 24;
const ICON_CENTER = 12;
const ICON_RADIUS = 10;
const ICON_STROKE_WIDTH = 2;

const formatTokens = (tokens?: number) => {
  if (tokens === undefined) {
    return;
  }
  if (!Number.isFinite(tokens)) {
    return;
  }
  const abs = Math.abs(tokens);
  if (abs < THOUSAND) {
    return `${tokens}`;
  }
  if (abs < MILLION) {
    return `${(tokens / THOUSAND).toFixed(1)}K`;
  }
  if (abs < BILLION) {
    return `${(tokens / MILLION).toFixed(1)}M`;
  }
  return `${(tokens / BILLION).toFixed(1)}B`;
};

const formatPercent = (value: number) => {
  if (!Number.isFinite(value)) {
    return '0%';
  }
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded)
    ? `${Math.trunc(rounded)}%`
    : `${rounded.toFixed(1)}%`;
};

const formatUSD = (value?: number) => {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  const abs = Math.abs(value);
  // Finer precision for very small amounts common in LLM pricing
  let decimals = 2;
  if (abs < 0.001) decimals = 5;
  else if (abs < 0.01) decimals = 4;
  else if (abs < 0.1) decimals = 3;
  else if (abs < 10) decimals = 2;
  else decimals = 1;
  const text = value.toFixed(decimals);
  // Trim trailing zeros/decimal if not needed (e.g., 1.2300 -> 1.23, 2.0 -> 2)
  const trimmed = text.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
  return `$${trimmed}`;
};

type ContextIconProps = {
  percent: number; // 0 - 100
};

export const ContextIcon = ({ percent }: ContextIconProps) => {
  const radius = ICON_RADIUS;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - percent / PERCENT_MAX);

  return (
    <svg
      aria-label={`${formatPercent(percent)} of model context used`}
      height="20"
      role="img"
      style={{ color: 'currentcolor' }}
      viewBox={`0 0 ${ICON_VIEWBOX} ${ICON_VIEWBOX}`}
      width="20"
    >
      <circle
        cx={ICON_CENTER}
        cy={ICON_CENTER}
        fill="none"
        opacity="0.25"
        r={radius}
        stroke="currentColor"
        strokeWidth={ICON_STROKE_WIDTH}
      />
      <circle
        cx={ICON_CENTER}
        cy={ICON_CENTER}
        fill="none"
        opacity="0.7"
        r={radius}
        stroke="currentColor"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        strokeWidth={ICON_STROKE_WIDTH}
        transform={`rotate(-90 ${ICON_CENTER} ${ICON_CENTER})`}
      />
    </svg>
  );
};

export const Context = ({
  className,
  maxTokens,
  usedTokens,
  usage,
  modelId,
  showBreakdown,
  ...props
}: ContextProps) => {
  const safeMax = Math.max(0, Number.isFinite(maxTokens) ? maxTokens : 0);
  const safeUsed = Math.min(
    Math.max(0, Number.isFinite(usedTokens) ? usedTokens : 0),
    safeMax,
  );
  const usedPercent =
    safeMax > 0
      ? Math.min(PERCENT_MAX, Math.max(0, (safeUsed / safeMax) * PERCENT_MAX))
      : 0;

  const displayPct = formatPercent(Math.round(usedPercent * 10) / 10);

  const used = formatTokens(safeUsed);
  const total = formatTokens(safeMax);

  const uNorm = normalizeUsage(usage as any);
  const uBreakdown = breakdownTokens(usage as any);
  const costUSD = modelId
    ? estimateCost({ modelId, usage: uNorm }).totalUSD
    : undefined;
  const costText = formatUSD(costUSD);

  const segInput = Math.max(0, uNorm.input ?? 0);
  const segOutput = Math.max(0, uNorm.output ?? 0);
  const segCacheR = Math.max(0, uBreakdown.cacheReads ?? 0);
  const segCacheW = Math.max(0, uBreakdown.cacheWrites ?? 0);
  const denom = safeMax > 0 ? safeMax : 1;
  const w = (n: number) =>
    `${Math.min(100, Math.max(0, (n / denom) * 100)).toFixed(2)}%`;
  const fmtOrUnknown = (n?: number) =>
    n === undefined ? '—' : formatTokens(n);
  return (
    <HoverCard closeDelay={100} openDelay={100}>
      <HoverCardTrigger asChild>
        <button
          className={cn(
            'inline-flex select-none items-center gap-2 rounded-md px-2.5 py-1 text-sm',
            'bg-background text-foreground',
          )}
          type="button"
          {...props}
        >
          <span className="font-medium text-muted-foreground">
            {displayPct}
          </span>
          <ContextIcon percent={usedPercent} />
        </button>
      </HoverCardTrigger>
      <HoverCardContent align="center" className="w-fit p-3">
        <div className="min-w-[240px] space-y-2">
          <p className="text-center text-sm">
            {displayPct} • {used} / {total} tokens
            {costText ? (
              <span className="ml-1 text-muted-foreground">• {costText}</span>
            ) : null}
          </p>
          {true && (
            <div className="space-y-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full"
                  style={{
                    width: w(segCacheR),
                    background: 'var(--chart-2)',
                    opacity: 0.9,
                  }}
                />
                <div
                  className="h-full"
                  style={{
                    width: w(segCacheW),
                    background: 'var(--chart-4)',
                    opacity: 0.9,
                  }}
                />
                <div
                  className="h-full"
                  style={{
                    width: w(segInput),
                    background: 'var(--chart-1)',
                    opacity: 0.9,
                  }}
                />
                <div
                  className="h-full"
                  style={{
                    width: w(segOutput),
                    background: 'var(--chart-3)',
                    opacity: 0.9,
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="inline-block size-2 rounded-sm bg-chart-1" />
                    Cache Hits
                  </span>
                  <span>{fmtOrUnknown(uBreakdown.cacheReads)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="inline-block size-2 rounded-sm bg-chart-2" />
                    Cache Writes
                  </span>
                  <span>{fmtOrUnknown(uBreakdown.cacheWrites)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="inline-block size-2 rounded-sm bg-chart-3" />
                    Input
                  </span>
                  <span>{formatTokens(uNorm.input)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="inline-block size-2 rounded-sm bg-chart-4" />
                    Output
                  </span>
                  <span>{formatTokens(uNorm.output)}</span>
                </div>
              </div>
            </div>
          )}
          {showBreakdown && (
            <div className="mt-1 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Cache Hits</span>
                <span>{fmtOrUnknown(uBreakdown.cacheReads)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Cache Writes</span>
                <span>{fmtOrUnknown(uBreakdown.cacheWrites)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Input</span>
                <span>{formatTokens(uNorm.input)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Output</span>
                <span>{formatTokens(uNorm.output)}</span>
              </div>
              {costText && (
                <>
                  <Separator className="mt-1" />
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-muted-foreground">Total cost</span>
                    <span>{costText}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
