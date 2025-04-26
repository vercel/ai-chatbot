import { useEffect, useRef, type RefObject } from 'react';

export function useScrollToBottom<T extends HTMLElement>(): [
  RefObject<T>,
  RefObject<T>,
] {
  const containerRef = useRef<T>(null);
  const endRef = useRef<T>(null);
  const shouldScrollRef = useRef(true);

  useEffect(() => {
    const container = containerRef.current;
    const end = endRef.current;

    if (container && end) {
      const intersectionObserver = new IntersectionObserver(
        ([entry]) => {
          shouldScrollRef.current = entry.isIntersecting;
        },
        { threshold: 0 },
      );

      intersectionObserver.observe(end);

      const mutationObserver = new MutationObserver(() => {
        if (shouldScrollRef.current) {
          end.scrollIntoView({ behavior: 'instant', block: 'end' });
        }
      });

      mutationObserver.observe(container, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });

      return () => {
        intersectionObserver.disconnect();
        mutationObserver.disconnect();
      };
    }
  }, []);

  return [containerRef, endRef];
}
