"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  duration?: number; // ms
  prefix?: string;
  decimals?: number;
  className?: string;
}

const easeOut = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

export function AnimatedNumber({
  value,
  duration = 1500,
  prefix = "",
  decimals = 0,
  className = "",
}: Props) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    startRef.current = null;

    const tick = (now: number) => {
      if (!mountedRef.current) return;

      if (startRef.current === null) startRef.current = now;

      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);

      setDisplay(value * easeOut(progress));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [value, duration]);

  const formatted = display.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span className={className}>
      {prefix}
      {formatted}
    </span>
  );
}
