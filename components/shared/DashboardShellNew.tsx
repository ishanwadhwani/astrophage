"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, PanelLeft, PanelLeftClose, Cable } from "lucide-react";

import { getUser, setActiveBusiness } from "@/lib/auth";
import SidebarNew from "./SidebarNew";
import NotificationBell from "./NotificationBell";

const LS_KEY = "lg-sidebar-open";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [lgSidebarOpen, setLgSidebarOpen] = useState(true);

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
    // Restore sidebar preference
    const stored = localStorage.getItem(LS_KEY);
    if (stored === "false") setLgSidebarOpen(false);
  }, []);

  const toggleLgSidebar = () => {
    setLgSidebarOpen((v) => {
      localStorage.setItem(LS_KEY, String(!v));
      return !v;
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar — collapsible via width transition, no backdrop */}
      <div
        className={`hidden shrink-0 lg:flex overflow-hidden transition-[width] duration-300 ease-in-out ${
          lgSidebarOpen ? "w-56" : "w-0"
        }`}
      >
        <SidebarNew />
      </div>

      {/* Mobile: backdrop */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] lg:hidden transition-all duration-300 ${
          mobileSidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileSidebarOpen(false)}
      />

      {/* Mobile: drawer — always in DOM, slides in/out */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 shadow-2xl shadow-black/20 lg:hidden
          transition-transform duration-300 ease-drawer
          ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <SidebarNew onClose={() => setMobileSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">

        {/* Mobile top bar */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4 lg:hidden">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="group -ml-2 flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
            aria-label="Open sidebar"
          >
            <Menu className="w-[18px] h-[18px] transition-transform duration-200 group-hover:scale-110" />
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

          <div className="ml-auto">
            <NotificationBell placement="header" />
          </div>
        </header>

        {/* Desktop top bar — collapse/expand toggle, no mobile equivalent */}
        <div className="hidden lg:flex h-14 shrink-0 items-center border-b border-border bg-card px-4">
          <button
            onClick={toggleLgSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            aria-label={lgSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {lgSidebarOpen ? (
              <PanelLeftClose className="w-[18px] h-[18px]" />
            ) : (
              <PanelLeft className="w-[18px] h-[18px]" />
            )}
          </button>
        </div>

        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
