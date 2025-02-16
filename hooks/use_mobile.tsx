import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);
  const [screenWidth, setScreenWidth] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (typeof window === 'undefined') return; // Guard clause for SSR

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    let timeoutId: NodeJS.Timeout;

    const onChange = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        setScreenWidth(window.innerWidth);
      }, 150);
    };

    mql.addEventListener('change', onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    setScreenWidth(window.innerWidth);
    return () => {
      mql.removeEventListener('change', onChange);
      clearTimeout(timeoutId);
    };
  }, []);

  return { isMobile: !!isMobile, screenWidth };
}

