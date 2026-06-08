"use client";

import { useState } from "react";
import { Check, Copy } from 'lucide-react';

interface Props {
  text:      string;
  className?: string;
}

export function CopyButton({ text, className = "" }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition ${className}`}
      title="Copy"
    >
      {copied ? (
        <Check className="w-3 h-3" />
      ) : (
        <Copy className="w-3 h-3" />
      )}
    </button>
  );
}