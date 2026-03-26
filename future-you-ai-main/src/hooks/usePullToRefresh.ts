import { useEffect, useRef, useState } from "react";

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number; // px to pull before triggering refresh
}

export function usePullToRefresh({ onRefresh, threshold = 72 }: UsePullToRefreshOptions) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onTouchStart = (e: TouchEvent) => {
      // Only activate pull-to-refresh when scrolled to the very top
      if (container.scrollTop === 0) {
        startY.current = e.touches[0].pageY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startY.current === null || isRefreshing) return;
      const distance = e.touches[0].pageY - startY.current;

      if (distance > 0 && container.scrollTop === 0) {
        // Apply easing so it gets harder to pull the further you go
        const eased = Math.min(distance * 0.45, threshold * 1.5);
        setPullDistance(eased);
        setIsPulling(true);
        // Prevent native overscroll while pulling
        if (distance > 4) e.preventDefault();
      }
    };

    const onTouchEnd = async () => {
      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(threshold);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }
      setPullDistance(0);
      setIsPulling(false);
      startY.current = null;
    };

    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd);

    return () => {
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
    };
  }, [onRefresh, threshold, pullDistance, isRefreshing]);

  return { containerRef, isPulling, pullDistance, isRefreshing, threshold };
}
