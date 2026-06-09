"use client";

import { useState } from "react";
import { Building2, Landmark, FilePen, Users } from "lucide-react";
import dynamic from "next/dynamic";
import { LoadingState } from "@/components/ui/LoadingState";
import PermissionGate from "@/components/ui/PermissionGate";

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

const TABS: { id: Tab; label: string; icon?: React.ReactNode }[] = [
  { id: "business", label: "Business Profile", icon: <Building2 /> },
  { id: "bank", label: "Bank Details", icon: <Landmark /> },
  { id: "invoice", label: "Invoice Settings", icon: <FilePen /> },
  { id: "team", label: "Manage Team", icon: <Users /> },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("business");

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your business profile, bank & invoice details and team
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-primary/80 rounded-full p-1 w-fit flex-wrap cursor-pointer">
        {TABS.map((t) => (
          <div
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              tab === t.id
                ? "w-fit bg-muted text-primary shadow-sm"
                : "text-primary-foreground hover:text-muted/90"
            }`}
          >
            <div className="w-4 h-4 mb-1.5">{t.icon}</div>
            <p className="mt-1 ml-2">{t.label}</p>
          </div>
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
