import { useEffect, useRef, type RefObject } from "react";

export function useScrollToBottom<T extends HTMLElement>(): [
  RefObject<T | null>,
  RefObject<T | null>,
] {
  const containerRef = useRef<T | null>(null);
  const endRef = useRef<T | null>(null);
  const shouldScrollRef = useRef(true);

  useEffect(() => {
    const container = containerRef.current;
    const end = endRef.current;

    if (container && end) {
      // Initial scroll
      end.scrollIntoView({ behavior: "instant", block: "end" });

      // Check if user has scrolled up
      const handleScroll = () => {
        if (!container) return;
        
        const isAtBottom = Math.abs(
          (container.scrollHeight - container.scrollTop) - container.clientHeight
        ) < 10;
        
        shouldScrollRef.current = isAtBottom;
      };

      const observer = new MutationObserver(() => {
        // Only scroll if we're at the bottom or it's a new message
        if (shouldScrollRef.current) {
          end.scrollIntoView({ behavior: "instant", block: "end" });
        }
      });

      observer.observe(container, {
        childList: true,
        subtree: true, // Watch nested changes
        characterData: true, // Watch text changes
      });

      // Add scroll listener
      container.addEventListener('scroll', handleScroll);

      return () => {
        observer.disconnect();
        container.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

  return [containerRef, endRef];
}
