"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { getUser, setActiveBusiness, logout } from "@/lib/auth";
import { BusinessSummary } from "@/types/auth";
import { ChevronRight } from "lucide-react";
import AuthSplit from "../_components/AuthSplit";

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
    <AuthSplit>
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {firstName ? `Hi, ${firstName} 👋` : "Welcome back"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Choose a workspace to continue
        </p>
      </div>

      {/* Business list */}
      <div className="space-y-2.5">
        {businesses.map((biz) => (
          <button
            key={biz.id}
            onClick={() => handlePick(biz)}
            className="group w-full flex items-center gap-3.5 px-4 py-3.5 bg-background border border-border rounded-2xl text-left transition-all duration-150 hover:border-primary/40 hover:shadow-sm hover:shadow-primary/5 active:scale-[0.99]"
          >
            {/* Avatar */}
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0 ring-1 ring-primary/10">
              {biz.name.charAt(0).toUpperCase()}
            </div>

            {/* Name + GSTIN */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {biz.name}
              </p>
              {biz.gstin && (
                <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">
                  {biz.gstin}
                </p>
              )}
            </div>

            {/* Role badge */}
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                roleBadge[biz.role] ?? roleBadge.VIEWER
              }`}
            >
              {biz.role}
            </span>

            {/* Arrow */}
            <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary shrink-0 transition-colors duration-150" />
          </button>
        ))}
      </div>

      {/* Sign out */}
      <div className="mt-8 pt-6 border-t border-border text-center">
        <button
          onClick={logout}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
        >
          Sign out &amp; switch account
        </button>
      </div>
    </AuthSplit>
  );
}
