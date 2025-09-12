'use client';

import { useControllableState } from '@radix-ui/react-use-controllable-state';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { ChevronDownIcon, DotIcon, type LucideIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import React, {
  createContext,
  memo,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type ChainOfThoughtContextValue = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isWorking: boolean;
  setIsWorking: (working: boolean) => void;
  duration: number;
  setDuration: (duration: number) => void;
};

const ChainOfThoughtContext = createContext<ChainOfThoughtContextValue | null>(
  null,
);

const useChainOfThought = () => {
  const context = useContext(ChainOfThoughtContext);
  if (!context) {
    throw new Error(
      'ChainOfThought components must be used within ChainOfThought',
    );
  }
  return context;
};

export type ChainOfThoughtProps = ComponentProps<'div'> & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  isWorking?: boolean;
  initialDuration?: number;
};

const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0
    ? `${minutes}m ${remainingSeconds}s`
    : `${minutes}m`;
};

export const ChainOfThought = memo(
  ({
    className,
    open,
    defaultOpen = false,
    onOpenChange,
    isWorking = false,
    initialDuration = 0,
    children,
    ...props
  }: ChainOfThoughtProps) => {
    const [isOpen, setIsOpen] = useControllableState({
      prop: open,
      defaultProp: defaultOpen,
      onChange: onOpenChange,
    });

    const [duration, setDuration] = useState(initialDuration);

    useEffect(() => {
      if (
        typeof initialDuration === 'number' &&
        initialDuration >= 0 &&
        initialDuration !== duration
      ) {
        setDuration(initialDuration);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialDuration]);

    const setIsWorking = (_working: boolean) => {};

    return (
      <ChainOfThoughtContext.Provider
        value={{
          isOpen,
          setIsOpen,
          isWorking,
          setIsWorking,
          duration,
          setDuration,
        }}
      >
        <div
          className={cn('not-prose max-w-prose w-full min-w-0', className)}
          {...props}
        >
          {children}
        </div>
      </ChainOfThoughtContext.Provider>
    );
  },
);

export type ChainOfThoughtHeaderProps = ComponentProps<
  typeof CollapsibleTrigger
> & {
  showDuration?: boolean;
};

export const ChainOfThoughtHeader = memo(
  ({
    className,
    children,
    showDuration = true,
    ...props
  }: ChainOfThoughtHeaderProps) => {
    const { isOpen, setIsOpen, isWorking, duration } = useChainOfThought();

    const displayText = useMemo(() => {
      if (!showDuration) {
        return children ?? 'Chain of Thought';
      }

      if (isWorking) {
        return children ?? 'Working';
      }

      // If duration is 0 but showDuration is true, this is a completed chain from a refresh
      // where we lost the timing data but still want to show completion
      if (duration === 0) {
        return children ?? 'Finished working';
      }

      return `Worked for ${formatDuration(duration)}`;
    }, [children, showDuration, isWorking, duration]);

    return (
      <Collapsible onOpenChange={setIsOpen} open={isOpen}>
        <CollapsibleTrigger
          className={cn(
            'inline-flex items-center gap-1.5 text-muted-foreground text-base font-medium transition-colors hover:text-foreground',
            className,
          )}
          {...props}
        >
          <span className="text-left">{displayText}</span>
        </CollapsibleTrigger>
      </Collapsible>
    );
  },
);

export type ChainOfThoughtStepProps = ComponentProps<'div'> & {
  icon?: LucideIcon;
  label?: string;
  description?: string;
  status?: 'complete' | 'active' | 'pending';
  collapsible?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export const ChainOfThoughtStep = memo(
  ({
    className,
    icon: Icon = DotIcon,
    label,
    description,
    status = 'complete',
    collapsible = false,
    open,
    defaultOpen = false,
    onOpenChange,
    children,
    ...props
  }: ChainOfThoughtStepProps) => {
    const statusStyles = {
      complete: 'text-muted-foreground',
      active: 'text-foreground',
      pending: 'text-muted-foreground/50',
    };

    const [isOpen, setIsOpen] = useControllableState({
      prop: open,
      defaultProp: defaultOpen,
      onChange: onOpenChange,
    });

    return (
      <div
        className={cn(
          'flex gap-2 text-sm w-full min-w-0',
          statusStyles[status],
          'fade-in-0 slide-in-from-top-2 animate-in',
          className,
        )}
        {...props}
      >
        <div className="relative mt-0.5">
          <Icon className="size-4" />
          <div className="-mx-px absolute top-7 bottom-0 left-1/2 w-px bg-border" />
        </div>
        <div className="flex-1 min-w-0 space-y-2 break-words">
          {collapsible ? (
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger className="inline-flex items-center gap-1.5 text-left text-foreground/80 hover:text-foreground transition-colors">
                <span className="truncate">{label ?? 'Details'}</span>
                <ChevronDownIcon
                  className={cn(
                    'size-4 shrink-0 text-muted-foreground transition-transform',
                    isOpen ? 'rotate-180' : 'rotate-0',
                  )}
                />
              </CollapsibleTrigger>
              {description && (
                <div className="text-muted-foreground text-sm mt-1">
                  {description}
                </div>
              )}
              <CollapsibleContent className="mt-2">
                {children}
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <>
              {label && <div>{label}</div>}
              {description && (
                <div className="text-muted-foreground text-sm">
                  {description}
                </div>
              )}
              {children}
            </>
          )}
        </div>
      </div>
    );
  },
);

export type ChainOfThoughtSearchResultsProps = ComponentProps<'div'>;

export const ChainOfThoughtSearchResults = memo(
  ({ className, ...props }: ChainOfThoughtSearchResultsProps) => (
    <div className={cn('flex items-center gap-2', className)} {...props} />
  ),
);

export type ChainOfThoughtSearchResultProps = ComponentProps<typeof Badge>;

export const ChainOfThoughtSearchResult = memo(
  ({ className, children, ...props }: ChainOfThoughtSearchResultProps) => (
    <Badge
      className={cn('gap-1 px-2 py-0.5 font-normal text-sm', className)}
      variant="secondary"
      {...props}
    >
      {children}
    </Badge>
  ),
);

export type ChainOfThoughtContentProps = ComponentProps<
  typeof CollapsibleContent
>;

export const ChainOfThoughtContent = memo(
  ({ className, children, ...props }: ChainOfThoughtContentProps) => {
    const { isOpen } = useChainOfThought();

    return (
      <Collapsible open={isOpen}>
        <CollapsibleContent
          className={cn(
            'mt-2 space-y-3 w-full min-w-0 overflow-hidden',
            'data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in',
            className,
          )}
          {...props}
        >
          {children}
        </CollapsibleContent>
      </Collapsible>
    );
  },
);

export type ChainOfThoughtImageProps = ComponentProps<'div'> & {
  caption?: string;
};

export const ChainOfThoughtImage = memo(
  ({ className, children, caption, ...props }: ChainOfThoughtImageProps) => (
    <div className={cn('mt-2 space-y-2', className)} {...props}>
      <div className="relative flex max-h-[22rem] items-center justify-center overflow-hidden rounded-lg bg-muted p-3">
        {children}
      </div>
      {caption && <p className="text-muted-foreground text-sm">{caption}</p>}
    </div>
  ),
);

ChainOfThought.displayName = 'ChainOfThought';
ChainOfThoughtHeader.displayName = 'ChainOfThoughtHeader';
ChainOfThoughtStep.displayName = 'ChainOfThoughtStep';
ChainOfThoughtSearchResults.displayName = 'ChainOfThoughtSearchResults';
ChainOfThoughtSearchResult.displayName = 'ChainOfThoughtSearchResult';
ChainOfThoughtContent.displayName = 'ChainOfThoughtContent';
ChainOfThoughtImage.displayName = 'ChainOfThoughtImage';
