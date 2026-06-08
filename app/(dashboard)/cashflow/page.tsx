"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

import { CashflowData } from "@/types/cashflow";
import { fetchCashflow } from "@/lib/cashflow";
import { getUser } from "@/lib/auth";
import CashflowStats from "./_components/CashflowStats";

const CashflowChart = dynamic(() => import("./_components/CashflowChart"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  ),
});
import CashflowTimeline from "./_components/CashflowTimeline";
import { LoadingState } from "@/components/ui/LoadingState";

const RANGES = [
  { label: "2 Weeks", days: 14 },
  { label: "30 Days", days: 30 },
  { label: "60 Days", days: 60 },
  { label: "90 Days", days: 90 },
];

export default function CashflowPage() {
  const user = getUser();
  const businessId = user?.business?.id;

  const [data, setData] = useState<CashflowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState(30);

  useEffect(() => {
    if (!businessId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await fetchCashflow(businessId, selectedDays);
        setData(result);
      } catch {
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [businessId, selectedDays]);

  if (loading) return <LoadingState page="cashflow" />;

  if (!data) return null;

  const { timeline, summary } = data;

  const activeDays = timeline.filter(
    (d) => d.expectedIn > 0 || d.expectedOut > 0,
  );

  const chartMax = Math.max(
    ...timeline.map((d) => Math.max(d.expectedIn, d.expectedOut)),
    0,
  );

  const isEmpty =
    summary.totalExpectedIn === 0 && summary.totalExpectedOut === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Cashflow Timeline
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Inflows and outflows over the next {selectedDays} days
          </p>
        </div>

        {/* Range selector */}
        <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setSelectedDays(r.days)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedDays === r.days
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <CashflowStats summary={summary} selectedDays={selectedDays} />

      {/* Chart */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">
            Daily Cashflow
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Solid = expected · striped = projected from recurring
          </p>
        </div>
        <div className="px-6 py-5">
          {isEmpty ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No cashflow data in this period.{" "}
              <Link
                href="/invoices/create"
                className="text-primary hover:underline"
              >
                Create an invoice
              </Link>{" "}
              or{" "}
              <Link href="/vendors" className="text-primary hover:underline">
                add a bill
              </Link>
              .
            </div>
          ) : (
            <CashflowChart timeline={timeline} />
          )}
        </div>
      </div>

      {/* Timeline breakdown */}
      <CashflowTimeline activeDays={activeDays} />
    </div>
  );
}
