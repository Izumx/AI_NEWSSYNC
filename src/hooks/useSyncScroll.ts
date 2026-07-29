"use client";

import { useCallback, useRef, type RefObject } from "react";

/**
 * Proportional scroll synchronisation between two scroll containers.
 * Returns onScroll handlers for each side; a guard flag prevents feedback loops.
 */
export function useSyncScroll(
  leftRef: RefObject<HTMLDivElement | null>,
  rightRef: RefObject<HTMLDivElement | null>,
  enabled: boolean,
) {
  const guard = useRef(false);

  const sync = useCallback(
    (src: RefObject<HTMLDivElement | null>, dst: RefObject<HTMLDivElement | null>) => {
      if (!enabled || guard.current) return;
      const a = src.current;
      const b = dst.current;
      if (!a || !b) return;
      guard.current = true;
      const ratio = a.scrollTop / Math.max(1, a.scrollHeight - a.clientHeight);
      b.scrollTop = ratio * (b.scrollHeight - b.clientHeight);
      requestAnimationFrame(() => {
        guard.current = false;
      });
    },
    [enabled],
  );

  const onLeftScroll = useCallback(() => sync(leftRef, rightRef), [sync, leftRef, rightRef]);
  const onRightScroll = useCallback(() => sync(rightRef, leftRef), [sync, leftRef, rightRef]);

  return { onLeftScroll, onRightScroll };
}
