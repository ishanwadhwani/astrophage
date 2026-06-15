"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellRing,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  X,
  CheckCheck,
} from "lucide-react";
import { AppNotification } from "@/types/notification";
import {
  fetchNotifications,
  markAllRead,
  markOneRead,
} from "@/lib/notifications";
import { getUser } from "@/lib/auth";

// ── Config ────────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  string,
  { icon: React.ReactNode; iconCls: string; bg: string }
> = {
  INVOICE_OVERDUE: {
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    iconCls: "text-status-overdue-foreground",
    bg: "bg-status-overdue/15",
  },
  INVOICE_DUE_SOON: {
    icon: <Clock className="w-3.5 h-3.5" />,
    iconCls: "text-status-pending-foreground",
    bg: "bg-status-pending/15",
  },
  BILL_OVERDUE: {
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    iconCls: "text-status-overdue-foreground",
    bg: "bg-status-overdue/15",
  },
  BILL_DUE_SOON: {
    icon: <Clock className="w-3.5 h-3.5" />,
    iconCls: "text-status-pending-foreground",
    bg: "bg-status-pending/15",
  },
  PAYMENT_RECEIVED: {
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    iconCls: "text-status-paid-foreground",
    bg: "bg-status-paid/15",
  },
  RECURRING_GENERATED: {
    icon: <RefreshCw className="w-3.5 h-3.5" />,
    iconCls: "text-primary",
    bg: "bg-primary/10",
  },
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d ago`;
  const hrs = Math.floor(diff / 3600000);
  if (hrs > 0) return `${hrs}h ago`;
  const mins = Math.floor(diff / 60000);
  return mins > 0 ? `${mins}m ago` : "just now";
};

// ── localStorage helpers for computed notification read state ─────────────────
// Computed notifications (overdue invoices/bills, due-soon) are regenerated
// fresh from DB every fetch and always arrive with read:false from the backend.
// We persist their dismissed IDs in localStorage so read state survives polls.

const dismissedKey = (businessId: string) => `nf_dismissed_${businessId}`;

const getDismissed = (businessId: string): Set<string> => {
  try {
    const raw = localStorage.getItem(dismissedKey(businessId));
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
};

const saveDismissed = (businessId: string, ids: Set<string>) => {
  try {
    localStorage.setItem(dismissedKey(businessId), JSON.stringify([...ids]));
  } catch {}
};

const addDismissed = (businessId: string, newIds: string[]) => {
  const set = getDismissed(businessId);
  newIds.forEach((id) => set.add(id));
  saveDismissed(businessId, set);
};

// Component 

interface Props {
  placement?: "sidebar" | "header";
}

export default function NotificationBell({ placement = "header" }: Props) {
  const router = useRouter();
  const businessId = getUser()?.business?.id;

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [marking, setMarking] = useState(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});

  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Merge backend data with localStorage dismissed state
  const applyDismissed = (
    notifications: AppNotification[],
  ): AppNotification[] => {
    if (!businessId) return notifications;
    const dismissed = getDismissed(businessId);
    return notifications.map((n) => ({
      ...n,
      read: n.computed ? dismissed.has(n.id) : n.read,
    }));
  };

  // Poll every 60 s
  useEffect(() => {
    if (!businessId) return;
    const load = async () => {
      try {
        const data = await fetchNotifications(businessId);
        const merged = applyDismissed(data.notifications);
        setItems(merged);
        // Recompute unread from merged state, not from backend count
        setUnread(merged.filter((n) => !n.read).length);
      } catch {}
    };
    void load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !panelRef.current?.contains(t))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const handleOpen = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      if (placement === "sidebar") {
        setPanelStyle({
          top: Math.min(r.top, window.innerHeight - 520),
          left: r.right + 10,
        });
      } else {
        setPanelStyle({
          top: r.bottom + 6,
          right: window.innerWidth - r.right,
        });
      }
    }
    setOpen((v) => !v);
  };

  // Mark ALL read: persist computed IDs to localStorage + call API for stored ones
  const handleMarkAll = async () => {
    if (!businessId || marking) return;
    setMarking(true);
    try {
      // 1. Dismiss all computed notification IDs in localStorage
      const computedIds = items
        .filter((n) => n.computed && !n.read)
        .map((n) => n.id);
      if (computedIds.length) addDismissed(businessId, computedIds);

      // 2. Mark stored notifications read in DB
      await markAllRead(businessId);

      // 3. Update UI
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } finally {
      setMarking(false);
    }
  };

  // Mark ONE read on click: localStorage for computed, API for stored
  const handleItemClick = async (n: AppNotification) => {
    if (!n.read && businessId) {
      if (n.computed) {
        // Persist to localStorage SYNCHRONOUSLY before any navigation
        addDismissed(businessId, [n.id]);
      } else {
        try {
          await markOneRead(n.id);
        } catch {}
      }
      setItems((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, read: true } : item)),
      );
      setUnread((prev) => Math.max(0, prev - 1));
    }
    // Navigate AFTER state + storage are updated
    if (n.link) router.push(n.link);
    setOpen(false);
  };

  const isSidebar = placement === "sidebar";

  return (
    <div className="relative">
      {/* Button */}
      <button
        ref={btnRef}
        onClick={handleOpen}
        aria-label="Notifications"
        className={
          isSidebar
            ? `group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground hover:translate-x-0.5`
            : `relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95`
        }
      >
        {unread > 0 ? (
          <BellRing className="w-5 h-5 shrink-0" />
        ) : (
          <Bell className="w-5 h-5 shrink-0" />
        )}

        {isSidebar && <span className="truncate">Notifications</span>}

        {unread > 0 && isSidebar && (
          <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-status-overdue/15 text-status-overdue-foreground border border-status-overdue-foreground/20">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
        {unread > 0 && !isSidebar && (
          <>
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-status-overdue-foreground text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
              {unread > 9 ? "9+" : unread}
            </span>
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-status-overdue-foreground/50 animate-ping" />
          </>
        )}
      </button>

      {/* Panel (fixed — escapes overflow:hidden on shell/sidebar) */}
      {open && (
        <div
          ref={panelRef}
          style={panelStyle}
          className="fixed z-[200] w-80 max-w-[calc(100vw-1rem)] bg-card border border-border rounded-2xl shadow-2xl shadow-black/10 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">
                Notifications
              </h3>
              {unread > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-status-overdue/15 text-status-overdue-foreground border border-status-overdue-foreground/20">
                  {unread} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  onClick={handleMarkAll}
                  disabled={marking}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all disabled:opacity-50"
                >
                  <CheckCheck className="w-3 h-3" />
                  All read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="w-6 h-6 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto overscroll-contain">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    All caught up
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    No new notifications right now.
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {items.map((n) => {
                  const cfg =
                    TYPE_CONFIG[n.type] ?? TYPE_CONFIG.PAYMENT_RECEIVED;
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleItemClick(n)}
                      className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50 ${
                        !n.read ? "bg-primary/[0.03]" : ""
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${cfg.bg} ${cfg.iconCls}`}
                      >
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm leading-snug ${!n.read ? "font-semibold text-foreground" : "font-medium text-foreground/80"}`}
                          >
                            {n.title}
                          </p>
                          {!n.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                          {n.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1 font-medium">
                          {timeAgo(n.createdAt)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="px-4 py-2 border-t border-border bg-muted/30">
              <p className="text-[10px] text-muted-foreground text-center">
                {items.length} notification{items.length !== 1 ? "s" : ""} ·
                refreshes every 60s
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
