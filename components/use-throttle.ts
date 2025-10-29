// Simple throttle utility for React state updates
// Usage: const throttledFn = useThrottle(fn, delay)
import { useRef, useCallback } from "react";

export function useThrottle<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  const lastCall = useRef(0);
  const timeout = useRef<NodeJS.Timeout | null>(null);
  const lastArgs = useRef<any[]>([]);

  const throttled = useCallback((...args: any[]) => {
    const now = Date.now();
    lastArgs.current = args;
    if (now - lastCall.current >= delay) {
      lastCall.current = now;
      fn(...args);
    } else {
      if (timeout.current) clearTimeout(timeout.current);
      timeout.current = setTimeout(() => {
        lastCall.current = Date.now();
        fn(...lastArgs.current);
      }, delay - (now - lastCall.current));
    }
  }, [fn, delay]);

  return throttled as T;
}
