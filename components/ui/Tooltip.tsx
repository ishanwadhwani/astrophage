"use client";

import { useLayoutEffect, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";

type TooltipVariant = "default" | "warning" | "info" | "error";
type TooltipSide = "top" | "bottom" | "left" | "right";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  variant?: TooltipVariant;
  side?: TooltipSide;
  delay?: number;
}

const variantStyles: Record<TooltipVariant, string> = {
  default: "bg-foreground text-background",
  warning: "bg-status-pending text-status-pending-foreground",
  info: "bg-primary text-primary-foreground",
  error: "bg-destructive text-destructive-foreground",
};

const GAP = 8;
const EDGE_MARGIN = 8;

export function Tooltip({
  content,
  children,
  variant = "default",
  side = "top",
  delay = 300,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [domReady, setDomReady] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => setDomReady(true), []);

  // Position after the bubble mounts (but before paint) so it never flashes
  // at the wrong spot — and so it can't get clipped by an ancestor's
  // overflow:hidden, since it's rendered via portal at the document root.
  useLayoutEffect(() => {
    if (!visible) return;
    const trigger = triggerRef.current;
    const bubble = bubbleRef.current;
    if (!trigger || !bubble) return;

    const t = trigger.getBoundingClientRect();
    const b = bubble.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let resolvedSide = side;
    if (resolvedSide === "top" && t.top - b.height - GAP < EDGE_MARGIN) {
      resolvedSide = "bottom";
    } else if (
      resolvedSide === "bottom" &&
      t.bottom + b.height + GAP > vh - EDGE_MARGIN
    ) {
      resolvedSide = "top";
    }

    let top = 0;
    let left = 0;

    if (resolvedSide === "top") {
      top = t.top - b.height - GAP;
      left = t.left + t.width / 2 - b.width / 2;
    } else if (resolvedSide === "bottom") {
      top = t.bottom + GAP;
      left = t.left + t.width / 2 - b.width / 2;
    } else if (resolvedSide === "left") {
      top = t.top + t.height / 2 - b.height / 2;
      left = t.left - b.width - GAP;
    } else {
      top = t.top + t.height / 2 - b.height / 2;
      left = t.right + GAP;
    }

    left = Math.min(Math.max(left, EDGE_MARGIN), vw - b.width - EDGE_MARGIN);
    top = Math.min(Math.max(top, EDGE_MARGIN), vh - b.height - EDGE_MARGIN);

    setCoords({ top, left });
  }, [visible, side]);

  const show = () => {
    timer.current = setTimeout(() => setVisible(true), delay);
  };

  const hide = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    setVisible(false);
    setCoords(null);
  };

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <div
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}
      {visible &&
        domReady &&
        createPortal(
          <div
            ref={bubbleRef}
            style={{
              position: "fixed",
              top: coords?.top ?? -9999,
              left: coords?.left ?? -9999,
              visibility: coords ? "visible" : "hidden",
            }}
            className={`
              z-300 rounded-lg px-2.5 py-1.5
              whitespace-nowrap text-xs font-medium
              shadow-md pointer-events-none
              ${variantStyles[variant]}
            `}
          >
            {content}
          </div>,
          document.body,
        )}
    </div>
  );
}
