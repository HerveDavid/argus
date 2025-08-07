import { useRef, useCallback } from 'react';

interface UseDoubleClickOptions {
  onSingleClick?: () => void;
  onDoubleClick?: () => void;
  delay?: number;
}

interface UseDoubleClickReturn {
  onClick: () => void;
  onDoubleClick: () => void;
}

export function useDoubleClick({
  onSingleClick,
  onDoubleClick,
  delay = 200,
}: UseDoubleClickOptions): UseDoubleClickReturn {
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleClick = useCallback(() => {
    if (clickTimerRef.current === null) {
      clickTimerRef.current = setTimeout(() => {
        onSingleClick?.();
        clickTimerRef.current = null;
      }, delay);
    }
  }, [onSingleClick, delay]);

  const handleDoubleClick = useCallback(() => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }
    clickTimerRef.current = null;
    onDoubleClick?.();
  }, [onDoubleClick]);

  return { onClick: handleClick, onDoubleClick: handleDoubleClick };
}
