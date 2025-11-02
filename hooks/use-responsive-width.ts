"use client";

import { useEffect, useState } from 'react';

// Comprehensive screen size breakpoints with corresponding widths
const SCREEN_BREAKPOINTS = {
  // Extra small devices (portrait phones, less than 640px)
  xs: { min: 0, max: 639, width: 'w-full' },
  // Small devices (landscape phones, tablets, 640px to 767px)
  sm: { min: 640, max: 767, width: 'w-full' },
  // Medium devices (small tablets, 768px to 1023px)
  md: { min: 768, max: 1023, width: 'w-full' },
  // Large devices (desktops, 1024px and up)
  lg: { min: 1024, max: 9999, width: 'max-w-3xl mx-auto' },
};

export function useResponsiveWidth() {
  const [screenSize, setScreenSize] = useState<string>(() => {
    // Initialize with a default value that works on server-side
    if (typeof window === 'undefined') return 'xs';
    
    const width = window.innerWidth;
    console.log('Initial window width:', width);
    for (const [key, breakpoint] of Object.entries(SCREEN_BREAKPOINTS)) {
      if (width >= breakpoint.min && width <= breakpoint.max) {
        console.log('Initial breakpoint detected:', key, breakpoint);
        return key;
      }
    }
    return 'xs';
  });

  const [widthClasses, setWidthClasses] = useState<string>(() => {
    if (typeof window === 'undefined') return 'w-full';
    
    const width = window.innerWidth;
    for (const [key, breakpoint] of Object.entries(SCREEN_BREAKPOINTS)) {
      if (width >= breakpoint.min && width <= breakpoint.max) {
        return breakpoint.width;
      }
    }
    return 'w-full';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateScreenSize = () => {
      const width = window.innerWidth;
      console.log('Resize detected, window width:', width);
      
      // Find the appropriate breakpoint
      for (const [key, breakpoint] of Object.entries(SCREEN_BREAKPOINTS)) {
        if (width >= breakpoint.min && width <= breakpoint.max) {
          console.log('Breakpoint found:', key, breakpoint, 'width classes:', breakpoint.width);
          setScreenSize(prevSize => {
            if (prevSize !== key) {
              console.log('Screen size changed from', prevSize, 'to', key);
              setWidthClasses(breakpoint.width);
              return key;
            }
            return prevSize;
          });
          break;
        }
      }
    };

    // Add resize listener with throttling
    let timeoutId: NodeJS.Timeout;
    const throttledUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateScreenSize, 16); // ~60fps
    };

    window.addEventListener('resize', throttledUpdate, { passive: true });
    window.addEventListener('orientationchange', throttledUpdate, { passive: true });

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', throttledUpdate);
      window.removeEventListener('orientationchange', throttledUpdate);
    };
  }, []);

  return {
    screenSize,
    widthClasses,
    isDesktop: screenSize === 'lg',
    isMobile: screenSize === 'xs' || screenSize === 'sm',
    isTablet: screenSize === 'md',
  };
}
