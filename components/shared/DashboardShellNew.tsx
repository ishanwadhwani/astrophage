"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PanelLeftOpen, Cable } from "lucide-react";

import { getUser, setActiveBusiness } from "@/lib/auth";
import SidebarNew from "./SidebarNew";
import NotificationBell from "./NotificationBell";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (!user) {
      window.location.assign("/login");
      return;
    }
    if (!user.business) {
      const list = user.businesses ?? [];
      if (list.length === 0) {
        window.location.assign("/no-business");
      } else if (list.length === 1) {
        setActiveBusiness(list[0]);
      } else {
        window.location.assign("/select-business");
      }
    }
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar — always visible */}
      <div className="hidden shrink-0 lg:flex lg:w-56">
        <SidebarNew />
      </div>

      {/* Mobile: backdrop */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] lg:hidden transition-all duration-300 ${
          sidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Mobile: drawer — always in DOM, slides in/out */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 shadow-2xl shadow-black/20 lg:hidden
          transition-transform duration-300 ease-drawer
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <SidebarNew onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="group -ml-2 flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
            aria-label="Open sidebar"
          >
            <PanelLeftOpen className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
          </button>

          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary shadow-sm shadow-primary/30">
              <Cable className="w-3.5 h-3.5 text-white" />
            </div>
            <Link href="/dashboard">
              <span className="text-sm font-bold tracking-tight text-foreground">
                CashFlow
              </span>
            </Link>
          </div>

          {/* Bell in header on mobile — panel opens downward */}
          <div className="ml-auto">
            <NotificationBell placement="header" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
