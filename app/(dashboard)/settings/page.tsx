"use client";

import { useState, useEffect } from "react";
import { Building2, Landmark, FilePen, Users } from "lucide-react";
import dynamic from "next/dynamic";
import { LoadingState } from "@/components/ui/LoadingState";

type Tab = "business" | "bank" | "invoice" | "team";

const TABS = [
  {
    id: "business" as Tab,
    label: "Business Profile",
    desc: "Identity, tax & address",
    icon: Building2,
    color: "text-chart-1",
    bg: "bg-chart-1/10",
  },
  {
    id: "bank" as Tab,
    label: "Bank Details",
    desc: "Payout account info",
    icon: Landmark,
    color: "text-chart-2",
    bg: "bg-chart-2/10",
  },
  {
    id: "invoice" as Tab,
    label: "Invoice Settings",
    desc: "Numbering & defaults",
    icon: FilePen,
    color: "text-chart-3",
    bg: "bg-chart-3/10",
  },
  {
    id: "team" as Tab,
    label: "Team & Access",
    desc: "Members & permissions",
    icon: Users,
    color: "text-primary",
    bg: "bg-primary/10",
  },
];

const BusinessSection = dynamic(() => import("./_sections/BusinessSection"), {
  loading: () => <LoadingState page="settings" />,
});
const BankSection = dynamic(() => import("./_sections/BankSection"), {
  loading: () => <LoadingState page="settings" />,
});
const InvoiceSection = dynamic(() => import("./_sections/InvoiceSection"), {
  loading: () => <LoadingState page="settings" />,
});
const TeamSection = dynamic(() => import("./_sections/TeamSection"), {
  loading: () => <LoadingState page="settings" />,
});

export default function SettingsPage() {
  const [tab, setTab]           = useState<Tab>("business");
  const [mounted, setMounted]   = useState(false);
  const [visible, setVisible]   = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(id);
  }, []);

  const handleTabChange = (t: Tab) => {
    if (t === tab) return;
    setVisible(false);
    setTimeout(() => { setTab(t); setVisible(true); }, 140);
  };

  return (
    <div className="max-w-5xl space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div
        className={`transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
      >
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your business profile, banking, invoicing and team access
        </p>
      </div>

      {/* ── Mobile: horizontal scroll tabs ─────────────────────────────── */}
      <div
        className={`lg:hidden flex gap-1 bg-muted rounded-xl p-1 overflow-x-auto hide-scrollbar transition-all duration-500 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
        style={{ transitionDelay: "60ms" }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all duration-150 ${
              tab === t.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className={`w-3.5 h-3.5 ${tab === t.id ? t.color : ""}`} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Desktop: sidebar + content ──────────────────────────────────── */}
      <div
        className={`grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-start transition-all duration-500 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`}
        style={{ transitionDelay: "100ms" }}
      >
        {/* Sidebar nav */}
        <nav className="hidden lg:flex flex-col gap-1 shrink-0">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleTabChange(t.id)}
                className={`group flex items-center gap-3 w-full px-3 py-3 rounded-xl text-left transition-all duration-150 ${
                  active
                    ? "bg-card border border-border shadow-sm"
                    : "hover:bg-muted/60 border border-transparent"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-150 ${
                    active ? t.bg : "bg-muted group-hover:bg-muted/80"
                  }`}
                >
                  <t.icon
                    className={`w-4 h-4 transition-colors duration-150 ${
                      active ? t.color : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  />
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold truncate transition-colors duration-150 ${
                    active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                  }`}>
                    {t.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">{t.desc}</p>
                </div>
                {active && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Content panel */}
        <div
          className={`min-w-0 transition-all duration-150 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
          }`}
        >
          {tab === "business" && <BusinessSection />}
          {tab === "bank"     && <BankSection />}
          {tab === "invoice"  && <InvoiceSection />}
          {tab === "team"     && <TeamSection />}
        </div>
      </div>

    </div>
  );
}
