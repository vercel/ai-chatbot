'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';
import type { LanguageModelUsage } from 'ai';
import { breakdownTokens, estimateCost, normalizeUsage } from 'tokenlens';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

export type ContextProps = ComponentProps<'button'> & {
  /** Total context window size in tokens */
  maxTokens: number;
  /** Tokens used so far */
  usedTokens: number;
  /** Optional full usage payload to enable breakdown view */
  usage?: LanguageModelUsage | undefined;
  /** Optional model id (canonical or alias) to compute cost */
  modelId?: string;
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

const formatUSDFixed = (value?: number, decimals = 5) => {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  return `$${Number(value).toFixed(decimals)}`;
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
      height="28"
      role="img"
      style={{ color: 'currentcolor' }}
      viewBox={`0 0 ${ICON_VIEWBOX} ${ICON_VIEWBOX}`}
      width="28"
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

function TokensWithCost({
  tokens,
  costText,
}: {
  tokens?: number;
  costText?: string;
}) {
  return (
    <span>
      {tokens === undefined ? '—' : formatTokens(tokens)}
      {costText ? (
        <span className="ml-2 text-muted-foreground">• {costText}</span>
      ) : null}
    </span>
  );
}

function InfoRow({
  label,
  tokens,
  costText,
}: {
  label: string;
  tokens?: number;
  costText?: string;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <TokensWithCost tokens={tokens} costText={costText} />
    </div>
  );
}

export const Context = ({
  className,
  maxTokens,
  usedTokens,
  usage,
  modelId,
  ...props
}: ContextProps) => {
  const safeMax = Math.max(0, Number.isFinite(maxTokens) ? maxTokens : 0);
  const safeUsed = Math.min(
    Math.max(0, Number.isFinite(usedTokens) ? usedTokens : 0),
    safeMax,
  );

  // used percent and used tokens to display (demo-aware)
  const displayUsedTokens = safeUsed;
  const usedPercent =
    safeMax > 0
      ? Math.min(
          PERCENT_MAX,
          Math.max(0, (displayUsedTokens / safeMax) * PERCENT_MAX),
        )
      : 0;

  const displayPct = formatPercent(Math.round(usedPercent * 10) / 10);

  const used = formatTokens(displayUsedTokens);
  const total = formatTokens(safeMax);

  const uNorm = normalizeUsage(usage);
  const uBreakdown = breakdownTokens(usage);

  const hasUsage =
    !!usage &&
    ((uNorm.input ?? 0) > 0 ||
      (uNorm.output ?? 0) > 0 ||
      (uBreakdown.cacheReads ?? 0) > 0 ||
      (uBreakdown.cacheWrites ?? 0) > 0 ||
      (uBreakdown.reasoningTokens ?? 0) > 0);

  // Values to render in rows (demo or real)
  const displayInput = uNorm.input;
  const displayOutput = uNorm.output;

  // Per-segment costs
  const inputCostText = modelId
    ? formatUSDFixed(
        estimateCost({
          modelId,
          usage: { input: displayInput ?? 0, output: 0 },
        }).inputUSD,
      )
    : undefined;
  const outputCostText = modelId
    ? formatUSDFixed(
        estimateCost({
          modelId,
          usage: { input: 0, output: displayOutput ?? 0 },
        }).outputUSD,
      )
    : undefined;
  // Not supported by tokenlens pricing hints; leave undefined so no bullet is shown
  const cacheReadsTokens = uBreakdown.cacheReads ?? 0;
  const cacheWritesTokens = uBreakdown.cacheWrites ?? 0;
  const cacheReadsCostText =
    modelId && cacheReadsTokens > 0
      ? formatUSDFixed(
          estimateCost({
            modelId,
            // Cast to any to support extended pricing fields provided by tokenlens
            usage: { cacheReads: cacheReadsTokens } as any,
          }).totalUSD,
        )
      : undefined;
  const cacheWritesCostText =
    modelId && cacheWritesTokens > 0
      ? formatUSDFixed(
          estimateCost({
            modelId,
            usage: { cacheWrites: cacheWritesTokens } as any,
          }).totalUSD,
        )
      : undefined;

  const reasoningTokens = uBreakdown.reasoningTokens ?? 0;
  let reasoningCostText: string | undefined;
  if (modelId && reasoningTokens > 0) {
    const est = estimateCost({
      modelId,
      usage: { reasoningTokens },
    }).totalUSD;
    // TokenLens does not provide reasoning pricing for some models. Show em dash when unknown.
    reasoningCostText =
      est && Number.isFinite(est) && est > 0 ? formatUSDFixed(est) : '—';
  }

  const costUSD = modelId
    ? estimateCost({
        modelId,
        usage: { input: displayInput ?? 0, output: displayOutput ?? 0 },
      }).totalUSD
    : undefined;
  const costText = formatUSDFixed(costUSD);

  const fmtOrUnknown = (n?: number) =>
    n === undefined ? '—' : formatTokens(n);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'inline-flex select-none items-center gap-1 rounded-md px-1.5 py-1 text-sm',
            'bg-background text-foreground',
            className,
          )}
          type="button"
          {...props}
        >
          <span className="font-medium text-muted-foreground hidden">
            {displayPct}
          </span>
          <ContextIcon percent={usedPercent} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-fit p-3">
        <div className="min-w-[240px] space-y-2">
          <div className="flex justify-between items-start text-sm">
            <span>{displayPct}</span>
            <span className="text-muted-foreground">{used} / {total} tokens</span>
          </div>
          <div className="space-y-2">
            <Progress className="h-2 bg-muted" value={usedPercent} />
          </div>
          <div className="mt-1 space-y-1">
            {hasUsage && uBreakdown.cacheReads && uBreakdown.cacheReads > 0 && (
              <InfoRow
                label="Cache Hits"
                tokens={uBreakdown.cacheReads}
                costText={cacheReadsCostText}
              />
            )}
            {hasUsage &&
              uBreakdown.cacheWrites &&
              uBreakdown.cacheWrites > 0 && (
                <InfoRow
                  label="Cache Writes"
                  tokens={uBreakdown.cacheWrites}
                  costText={cacheWritesCostText}
                />
              )}
            <InfoRow
              label="Input"
              tokens={displayInput}
              costText={inputCostText}
            />
            <InfoRow
              label="Output"
              tokens={displayOutput}
              costText={outputCostText}
            />
            <InfoRow
              label="Reasoning"
              tokens={reasoningTokens > 0 ? reasoningTokens : undefined}
              costText={reasoningCostText}
            />
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
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
