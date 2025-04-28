import { useEffect, useRef } from 'react';

export function useScrollToBottom<T extends HTMLElement>() {
  const containerRef = useRef<T>(null);
  const endRef = useRef<T>(null);
  const shouldScrollRef = useRef(true);

  const scrollToBottom = () => {
    if (endRef.current) {
      endRef.current.scrollIntoView({
        behavior: 'instant',
        block: 'end',
      });
    }
  };

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
          scrollToBottom();
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

  return {
    containerRef,
    endRef,
    scrollToBottom,
  };
}

export type UseScrollToBottomReturn = ReturnType<typeof useScrollToBottom>;
