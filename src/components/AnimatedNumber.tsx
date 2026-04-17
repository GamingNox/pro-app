"use client";

import { useEffect, useRef, useState, memo } from "react";

/**
 * Animated count-up number. Counts from 0 to `value` over `duration` ms.
 * Uses requestAnimationFrame for smooth 60fps rendering.
 *
 * <AnimatedNumber value={1234} suffix=" €" />
 */
function AnimatedNumberComponent({
  value,
  duration = 800,
  prefix = "",
  suffix = "",
  className = "",
}: {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const prevValue = useRef(0);

  useEffect(() => {
    const from = prevValue.current;
    const to = value;
    prevValue.current = value;

    if (from === to) {
      setDisplay(to);
      return;
    }

    const delta = to - from;
    startRef.current = null;

    function animate(ts: number) {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + delta * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}{display.toLocaleString("fr-FR")}{suffix}
    </span>
  );
}

export default memo(AnimatedNumberComponent);
