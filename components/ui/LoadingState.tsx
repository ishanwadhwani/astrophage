"use client";

import { useState, useEffect } from "react";

export const loadingMessages = {
  dashboard: [
    "Crunching the numbers...",
    "Loading tables for ya...",
    "Generating your charts...",
    "Organizing transactions...",
    "Almost there...",
  ],
  invoices: [
    "Fetching your invoices...",
    "Loading payment records...",
    "Calculating outstanding amounts...",
    "Almost ready...",
  ],
  invoiceDetail: [
    "Loading invoice details...",
    "Fetching payment history...",
    "Calculating outstanding balance...",
  ],
  clients: [
    "Loading client directory...",
    "Fetching contact details...",
    "Almost there...",
  ],
  vendors: [
    "Loading vendor list...",
    "Fetching your bills...",
    "Calculating payables...",
  ],
  cashflow: [
    "Building your cashflow timeline...",
    "Crunching inflows and outflows...",
    "Calculating net position...",
    "Plotting your financial future...",
    "Almost ready...",
  ],
  settings: ["Loading business profile...", "Fetching bank details..."],
  default: ["Loading...", "Almost there...", "Just a moment..."],
} as const;

export type LoadingPage = keyof typeof loadingMessages;

interface Props {
  page?: LoadingPage;
  fullScreen?: boolean;
}

export function LoadingState({ page = "default", fullScreen = false }: Props) {
  const messages = loadingMessages[page];
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${
        fullScreen ? "min-h-screen" : "min-h-64"
      }`}
    >
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      <p className="text-sm font-medium text-muted-foreground animate-pulse">
        {messages[messageIndex]}
      </p>
    </div>
  );
}
