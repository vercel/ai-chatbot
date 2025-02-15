import { useEffect, useRef, type RefObject } from "react";

export function useScrollToBottom<T extends HTMLElement>(): [
  RefObject<T>,
  RefObject<T>,
] {
  const containerRef = useRef<T>(null);
  const endRef = useRef<T>(null);
  const userScrolledRef = useRef(false);
  const autoScrollInProgress = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    const end = endRef.current;

    if (container && end) {
      const observer = new MutationObserver(() => {
        if (!userScrolledRef.current) {
          autoScrollInProgress.current = true;
          end.scrollIntoView({ behavior: "smooth", block: "end" });

          // 处理滚动结束事件
          const handleScrollEnd = () => {
            autoScrollInProgress.current = false;
            container.removeEventListener("scrollend", handleScrollEnd);
          };

          if ("onscrollend" in window) {
            container.addEventListener("scrollend", handleScrollEnd);
          } else {
            // 回退：假设滚动动画在1秒内完成
            setTimeout(() => {
              autoScrollInProgress.current = false;
            }, 1000);
          }
        }
      });

      const handleScroll = () => {
        if (autoScrollInProgress.current) return;

        // 检查是否滚动到底部
        const { scrollTop, scrollHeight, clientHeight } = container;
        const isAtBottom = scrollHeight - (scrollTop + clientHeight) < 1;

        userScrolledRef.current = !isAtBottom;
      };

      container.addEventListener("scroll", handleScroll);
      observer.observe(container, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });

      return () => {
        observer.disconnect();
        container.removeEventListener("scroll", handleScroll);
      };
    }
  }, []);

  return [containerRef, endRef];
}
