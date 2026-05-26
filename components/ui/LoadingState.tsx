import { useState, useEffect } from "react";

export function LoadingState() {
  const messages = [
    "Crunching the numbers...",
    "Loading tables for ya...",
    "Generating your charts...",
    "Organizing transactions...",
    "Almost there...",
  ];

  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="flex flex-col items-center justify-center min-h-64 gap-4">
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      <p className="text-sm font-medium text-muted-foreground animate-pulse">
        {messages[messageIndex]}
      </p>
    </div>
  );
}
