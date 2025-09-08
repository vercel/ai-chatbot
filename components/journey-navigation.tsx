'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { RouteIcon } from './icons';
import { cn } from '@/lib/utils';
import type { Phase } from '@/apps/web/lib/journey/map';
import { phases, journeyMap } from '@/apps/web/lib/journey/map';

interface JourneyNavigationProps {
  readonly currentPhase?: Phase;
  readonly onPhaseChange?: (phase: Phase) => void;
  readonly className?: string;
}

export function JourneyNavigation({
  currentPhase,
  onPhaseChange,
  className,
}: JourneyNavigationProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const currentIndex = currentPhase ? phases.indexOf(currentPhase) : -1;
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex >= 0 && currentIndex < phases.length - 1;

  const handlePrev = () => {
    if (canGoPrev && onPhaseChange) {
      onPhaseChange(phases[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (canGoNext && onPhaseChange) {
      onPhaseChange(phases[currentIndex + 1]);
    }
  };

  const handlePhaseClick = (phase: Phase) => {
    if (onPhaseChange) {
      onPhaseChange(phase);
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2"
      >
        <RouteIcon size={16} />
        Jornada Solar
      </Button>

      {currentPhase && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={!canGoPrev}
            className="size-8 p-0"
          >
            ‹
          </Button>

          <span className="text-sm font-medium px-2">{currentPhase}</span>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
            disabled={!canGoNext}
            className="size-8 p-0"
          >
            ›
          </Button>
        </div>
      )}

      {isExpanded && (
        <div className="absolute top-full mt-2 bg-background border rounded-lg shadow-lg p-4 z-50 min-w-64">
          <h3 className="font-semibold mb-3">Fases da Jornada Solar</h3>
          <div className="space-y-2">
            {phases.map((phase, index) => (
              <button
                key={phase}
                type="button"
                onClick={() => handlePhaseClick(phase)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                  phase === currentPhase
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted',
                )}
              >
                <div className="flex items-center justify-between">
                  <span>{phase}</span>
                  <span className="text-xs opacity-60">
                    {index + 1}/{phases.length}
                  </span>
                </div>
                <div className="text-xs opacity-60 mt-1">
                  {journeyMap[phase].cards.join(', ')}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
