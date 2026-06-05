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
  CircleX,
} from "lucide-react";

import { logout } from "@/lib/auth";

const BusinessSwitcher = dynamic(() => import("./BusinessSwitcher"), {
  ssr: false,
});

type StoredUser = {
  name?: string;
  business?: {
    name?: string;
  };
} | null;

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: "Clients",
    href: "/clients",
    icon: <Users className="w-5 h-5" />,
  },
  {
    label: "Invoices",
    href: "/invoices",
    icon: <FileText className="w-5 h-5" />,
  },
  {
    label: "Vendors",
    href: "/vendors",
    icon: <Store className="w-5 h-5" />,
  },
  {
    label: "Cashflow",
    href: "/cashflow",
    icon: <ChartNoAxesCombined className="w-5 h-5" />,
  },
  {
    label: "Reports",
    href: "/reports",
    icon: <NotebookText className="w-5 h-5" />,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: <Settings className="w-5 h-5" />,
  },
];

interface SidebarProps {
  onClose?: () => void;
}

export default function SidebarNew({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<StoredUser>(null);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const stored = localStorage.getItem("user");

      if (!stored) {
        setUser(null);
        return;
      }

      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    }, 0);

    return () => window.clearTimeout(id);
  }, []);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() ?? "U";

  return (
    <aside className="flex h-full w-full flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center justify-between border-b border-border px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary">
            <Cable className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight text-foreground">
            CashFlow
          </span>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg transition lg:hidden cursor-pointer"
            aria-label="Close sidebar"
          >
            <CircleX className="w-5.5 h-5.5 text-gray-400 hover:text-primary" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                active
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span
                className={`w-5 h-5 ${active ? "text-primary-foreground" : "text-muted-foreground"}`}
              >
                {item.icon}
              </span>
              <span className="text-md">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border">
        <BusinessSwitcher />
      </div>

      <div className="px-3 py-3 border-t border-border shrink-0">
        <div className="flex items-center gap-3 rounded-xl bg-muted/60 px-3 py-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
            {initial}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-foreground">
              {user?.name ?? "User"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.business?.name ?? ""}
            </p>
          </div>

          <button
            onClick={logout}
            title="Sign out"
            className="shrink-0 text-muted-foreground transition hover:text-destructive"
          >
            <LogOut className="w-4 h-4 "/>
          </button>
        </div>
      </div>
    </aside>
  );
}
