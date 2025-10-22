'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type SuggestionChip = {
  id: string;
  text: string;
  category?: 'strategy' | 'leadership' | 'tactical' | 'company';
  icon?: React.ReactNode;
};

interface SuggestionChipsProps {
  chips: SuggestionChip[];
  onChipClick: (chip: SuggestionChip) => void;
  className?: string;
}

export function SuggestionChips({ chips, onChipClick, className }: SuggestionChipsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTimeRef = useRef<number>(Date.now());

  // Auto-scroll animation
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const startAutoScroll = () => {
      if (autoScrollIntervalRef.current) return;

      autoScrollIntervalRef.current = setInterval(() => {
        if (!isHovered && !userHasScrolled && container) {
          const maxScroll = container.scrollWidth - container.clientWidth;
          const newScrollLeft = container.scrollLeft + 1;

          if (newScrollLeft >= maxScroll) {
            container.scrollLeft = 0;
          } else {
            container.scrollLeft = newScrollLeft;
          }
        }
      }, 30);
    };

    const stopAutoScroll = () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
    };

    // Start auto-scroll after 5 seconds of inactivity
    const idleTimer = setTimeout(() => {
      if (!isHovered && !userHasScrolled) {
        startAutoScroll();
      }
    }, 5000);

    return () => {
      clearTimeout(idleTimer);
      stopAutoScroll();
    };
  }, [isHovered, userHasScrolled]);

  // Track user scroll
  const handleScroll = () => {
    const now = Date.now();
    if (now - lastScrollTimeRef.current > 100) {
      setUserHasScrolled(true);
      lastScrollTimeRef.current = now;

      // Reset user scroll flag after 5 seconds of no scrolling
      setTimeout(() => {
        setUserHasScrolled(false);
      }, 5000);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (e.key === 'ArrowLeft' && index > 0) {
      const prevButton = container.children[index - 1] as HTMLElement;
      prevButton?.focus();
      prevButton?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    } else if (e.key === 'ArrowRight' && index < chips.length - 1) {
      const nextButton = container.children[index + 1] as HTMLElement;
      nextButton?.focus();
      nextButton?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  // Get category color
  const getCategoryStyle = (category?: string) => {
    switch (category) {
      case 'leadership':
        return { color: 'border-yellow-500/30 hover:border-yellow-500/50' };
      case 'strategy':
        return { color: 'border-blue-500/30 hover:border-blue-500/50' };
      case 'tactical':
        return { color: 'border-green-500/30 hover:border-green-500/50' };
      case 'company':
        return { color: 'border-purple-500/30 hover:border-purple-500/50' };
      default:
        return { color: 'border-white/10' };
    }
  };

  return (
    <div
      ref={scrollContainerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onScroll={handleScroll}
      className={cn(
        "overflow-x-auto snap-x snap-mandatory",
        "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        "flex gap-3 px-4 py-3",
        className
      )}
    >
      {chips.map((chip, index) => {
        const style = getCategoryStyle(chip.category);
        return (
          <Button
            key={chip.id}
            variant="ghost"
            onClick={() => onChipClick(chip)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              "snap-start shrink-0 rounded-full",
              "bg-white/5 backdrop-blur-sm border-2",
              style.color,
              "px-6 py-2.5 h-auto",
              "text-sm font-medium",
              "hover:scale-105 hover:bg-white/10 hover:shadow-lg",
              "active:scale-95",
              "focus-visible:ring-2 focus-visible:ring-primary",
              "transition-all duration-200"
            )}
          >
            {chip.icon && <span className="mr-2">{chip.icon}</span>}
            {chip.text}
          </Button>
        );
      })}
    </div>
  );
}
