"use client";

import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth";

export default function NoBusinessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-status-pending/15 flex items-center justify-center mx-auto mb-4">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="hsl(var(--status-pending-foreground))"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <h1 className="text-lg font-bold text-foreground mb-2">
          No business found
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          Your account isn&apos;t linked to any business yet. If you were
          invited to one, the invitation may not have been accepted correctly or
          it may have expired. Try opening your invite link again, or contact
          whoever invited you.
        </p>

        <div className="space-y-2">
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition"
          >
            Try again
          </button>
          <button
            onClick={logout}
            className="w-full py-2.5 border border-border text-sm font-medium text-muted-foreground rounded-xl hover:bg-muted transition"
          >
            Sign out &amp; use a different account
          </button>
        </div>
      </div>
    </div>
  );
}
