"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { getUser, setActiveBusiness, logout } from "@/lib/auth";
import { BusinessSummary } from "@/types/auth";

const roleBadge: Record<string, string> = {
  OWNER: "bg-primary/10 text-primary",
  ADMIN: "bg-status-paid/15 text-status-paid-foreground",
  EDITOR: "bg-status-pending/15 text-status-pending-foreground",
  ACCOUNTANT: "bg-accent/15 text-accent-foreground",
  VIEWER: "bg-muted text-muted-foreground",
};

// Hydration-safe "are we on the client yet" flag
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function SelectBusinessPage() {
  const router = useRouter();

  // false on server + first client render, true after hydration
  const mounted = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  // Only read localStorage after mount (client-only)
  const user = mounted ? getUser() : null;
  const businesses = user?.businesses ?? [];
  const firstName = user?.name?.split(" ")[0] ?? "";

  useEffect(() => {
    if (!mounted) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (businesses.length === 0) {
      router.replace("/no-business");
      return;
    }
    if (businesses.length === 1) {
      setActiveBusiness(businesses[0]);
      router.replace("/dashboard");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const handlePick = (business: BusinessSummary) => {
    setActiveBusiness(business);
    window.location.assign("/dashboard");
  };

  // Not mounted yet, or redirecting → render nothing (matches server output)
  if (!mounted || !user || businesses.length <= 1) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
              </svg>
            </div>
            <span className="text-lg font-bold text-foreground">
              CashFlow Command
            </span>
          </div>
          <h1 className="text-xl font-bold text-foreground">
            {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Choose a business to continue
          </p>
        </div>

        <div className="space-y-2">
          {businesses.map((biz) => (
            <button
              key={biz.id}
              onClick={() => handlePick(biz)}
              className="w-full flex items-center gap-3 p-4 bg-card border border-border rounded-2xl text-left transition-all hover:border-primary/40 hover:shadow-sm group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-base font-bold flex-shrink-0">
                {biz.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {biz.name}
                </p>
                {biz.gstin && (
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {biz.gstin}
                  </p>
                )}
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${roleBadge[biz.role] ?? roleBadge.VIEWER}`}
              >
                {biz.role}
              </span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0"
              >
                <polyline points="9,18 15,12 9,6" />
              </svg>
            </button>
          ))}
        </div>

        <button
          onClick={logout}
          className="w-full mt-6 text-center text-sm text-muted-foreground hover:text-foreground transition"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
