"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Store,
  ChartNoAxesCombined,
  NotebookText,
  Settings,
  Cable,
  LogOut,
  X,
} from "lucide-react";

import { logout } from "@/lib/auth";
import { can } from "@/lib/permissions";
import NotificationBell from "./NotificationBell";

const BusinessSwitcher = dynamic(() => import("./BusinessSwitcher"), {
  ssr: false,
});

type StoredUser = {
  name?: string;
  business?: { name?: string; role?: string };
} | null;

const allNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Clients",   href: "/clients",   icon: Users },
  { label: "Invoices",  href: "/invoices",  icon: FileText },
  { label: "Vendors",   href: "/vendors",   icon: Store },
  { label: "Cashflow",  href: "/cashflow",  icon: ChartNoAxesCombined },
  { label: "Reports",   href: "/reports",   icon: NotebookText },
  { label: "Settings",  href: "/settings",  icon: Settings },
];

interface SidebarProps {
  onClose?: () => void;
}

export default function SidebarNew({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const [user, setUser]       = useState<StoredUser>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const stored = localStorage.getItem("user");
      if (stored) {
        try { setUser(JSON.parse(stored)); } catch {}
      }
      setMounted(true);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const navItems = user
    ? allNavItems.filter((item) => {
        if (item.href === "/settings")
          return can("settings:edit") || can("team:manage");
        return true;
      })
    : allNavItems;

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  const initial = user?.name?.charAt(0)?.toUpperCase() ?? "U";

  return (
    <aside className="flex h-full w-full flex-col bg-card border-r border-border">

      {/* ── Brand header ───────────────────────────────────────────────── */}
      <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/30">
            <Cable className="w-4 h-4 text-white" />
          </div>
          <div className="leading-none">
            <span className="block text-sm font-bold tracking-tight text-foreground">
              CashFlow
            </span>
            <span className="block text-[10px] text-muted-foreground mt-0.5">
              Command
            </span>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-muted hover:text-foreground lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto hide-scrollbar px-3 py-4 space-y-0.5">
        {navItems.map((item, idx) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              style={{
                transitionDelay: mounted ? `${idx * 35}ms` : "0ms",
              }}
              className={`
                group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium
                transition-all duration-200 overflow-hidden
                ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
                ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-0.5"
                }
              `}
            >
              {/* Subtle shimmer on active item */}
              {active && (
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
              )}

              <Icon
                className={`w-5 h-5 shrink-0 transition-transform duration-200 ${
                  active ? "text-primary-foreground" : "group-hover:scale-110"
                }`}
              />
              <span className="truncate">{item.label}</span>

              {/* Active indicator dot */}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-foreground/60 shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Notifications ──────────────────────────────────────────────── */}
      <div className="border-t border-border px-3 py-2">
        <NotificationBell placement="sidebar" />
      </div>

      {/* ── Business switcher ──────────────────────────────────────────── */}
      <div className="border-t border-border">
        <BusinessSwitcher />
      </div>

      {/* ── User card ──────────────────────────────────────────────────── */}
      <div
        className={`px-3 py-3 border-t border-border transition-all duration-500 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
        style={{ transitionDelay: mounted ? `${(navItems.length + 1) * 35}ms` : "0ms" }}
      >
        <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2.5 border border-border/60">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary ring-2 ring-primary/10">
            {initial}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-foreground leading-tight">
              {user?.name ?? "User"}
            </p>
            <p className="truncate text-[10px] text-muted-foreground mt-0.5 capitalize">
              {user?.business?.role?.toLowerCase() ?? user?.business?.name ?? ""}
            </p>
          </div>

          <button
            onClick={logout}
            title="Sign out"
            className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
