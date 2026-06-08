"use client";

import { useState } from "react";
import Link from "next/link";
import { PanelLeftOpen, Cable } from "lucide-react";

import SidebarNew from "./SidebarNew";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden shrink-0 lg:flex lg:w-56">
        <SidebarNew />
      </div>

      {sidebarOpen && (
        <>
          <div
            className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
              sidebarOpen
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none"
            }`}
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden">
            <SidebarNew onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition"
            aria-label="Open sidebar"
          >
            <PanelLeftOpen className="w-5.5 h-5.5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
              <Cable className="w-4 h-4 text-white" />
            </div>
            <Link href="/dashboard">
              <span className="text-sm font-bold text-foreground">
                CashFlow
              </span>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
