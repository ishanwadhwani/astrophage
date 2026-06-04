"use client";

import { useState, useRef, useEffect } from "react";

type TooltipVariant = "default" | "warning" | "info" | "error";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  variant?: TooltipVariant;
  side?: "top" | "bottom" | "left" | "right";
  delay?: number;
}

const variantStyles: Record<TooltipVariant, string> = {
  default: "bg-foreground text-background",
  warning: "bg-status-pending text-status-pending-foreground",
  info: "bg-primary text-primary-foreground",
  error: "bg-destructive text-destructive-foreground",
};

const sideStyles = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

export function Tooltip({
  content,
  children,
  variant = "default",
  side = "top",
  delay = 300,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    timer.current = setTimeout(() => setVisible(true), delay);
  };

  const hide = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    setVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}
      {visible && (
        <div
          className={`
            absolute z-50 rounded-lg px-2.5 py-1.5
            whitespace-nowrap text-xs font-medium
            shadow-md pointer-events-none
            animate-in fade-in zoom-in-95 duration-150
            ${variantStyles[variant]}
            ${sideStyles[side]}
          `}
        >
          {content}
        </div>
      )}
    </div>
  );
}
