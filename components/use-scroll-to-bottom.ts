import { useEffect, useRef, type RefObject } from 'react';

export function useScrollToBottom<T extends HTMLElement>(
  isGenerating = false,
): [RefObject<T>, RefObject<T>] {
  const containerRef = useRef<T>(null);
  const endRef = useRef<T>(null);

  useEffect(() => {
    const container = containerRef.current;
    const end = endRef.current;

    if (!isGenerating || !container || !end) {
      return;
    }

    const observer = new MutationObserver(() => {
      end.scrollIntoView({ behavior: 'instant', block: 'end' });
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [isGenerating]);

  return [containerRef, endRef];
}
