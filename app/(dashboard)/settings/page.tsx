"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { LoadingState } from "@/components/ui/LoadingState";

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

type Tab = "business" | "bank" | "invoice" | "team";

const TABS: { id: Tab; label: string }[] = [
  { id: "business", label: "Business Profile" },
  { id: "bank", label: "Bank Details" },
  { id: "invoice", label: "Invoice Settings" },
  { id: "team", label: "Team" },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("business");

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your business profile, bank details and team
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-muted rounded-xl p-1 w-fit flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Sections — only active one loads */}
      {tab === "business" && <BusinessSection />}
      {tab === "bank" && <BankSection />}
      {tab === "invoice" && <InvoiceSection />}
      {tab === "team" && <TeamSection />}
    </div>
  );
}
