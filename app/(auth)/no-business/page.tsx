"use client";

import { logout } from "@/lib/auth";
import { AlertTriangle, RefreshCw, LogOut } from "lucide-react";
import AuthSplit from "../_components/AuthSplit";

export default function NoBusinessPage() {
  return (
    <AuthSplit>
      {/* Icon */}
      <div className="w-14 h-14 rounded-2xl bg-status-pending/10 border border-status-pending-foreground/15 flex items-center justify-center mb-6">
        <AlertTriangle className="w-7 h-7 text-status-pending-foreground" />
      </div>

      {/* Copy */}
      <h1 className="text-2xl font-bold text-foreground tracking-tight mb-2">
        No business found
      </h1>
      <p className="text-sm text-muted-foreground leading-relaxed mb-8">
        Your account isn&apos;t linked to any business yet. If you were invited
        to one, the invitation may not have been accepted correctly or it may
        have expired. Try opening your invite link again, or contact whoever
        invited you.
      </p>

      {/* Actions */}
      <div className="space-y-2.5">
        <button
          onClick={() => window.location.reload()}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all duration-150 active:scale-[0.98]"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-background border border-border text-sm font-medium text-muted-foreground rounded-xl hover:bg-muted hover:text-foreground transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          Sign out &amp; use a different account
        </button>
      </div>
    </AuthSplit>
  );
}
