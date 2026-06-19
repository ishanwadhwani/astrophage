"use client";

import { useState } from "react";
import { GSTReport } from "@/types/gst";
import {
  fetchGSTReport,
  fetchVendorSpending,
  VendorSpendingReport,
} from "@/lib/reports";
import { getUser } from "@/lib/auth";
import { LoadingState } from "@/components/ui/LoadingState";
import PermissionGate from "@/components/ui/PermissionGate";
import {
  Sheet,
  ReceiptIndianRupee,
  FileBarChart,
  ChevronRight,
  BriefcaseBusiness,
  MessageSquareText 
} from "lucide-react";
import DateRangeFilter, { DateRange } from "@/components/ui/DateRangeFilter";
import { fetchHealthReport, fetchHsnSummary } from "@/lib/reports";
import { HealthReport, HsnSummaryReport } from "@/types/reports";

import GSTTab from "./_components/GSTTab";
import VendorTab from "./_components/VendorTab";
import HealthTab from "./_components/HealthTab";
import HSNTab from "./_components/HSNTab";

type ReportType = "gst" | "vendor" | "health" | "hsn";

const getThisMonth = (): DateRange => {
  const now = new Date();
  const iso = (d: Date) => d.toISOString().split("T")[0];
  return {
    from: iso(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: iso(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
};

export default function ReportsPage() {
  const user = getUser();
  const businessId = user?.business?.id;

  const [dateRange, setDateRange] = useState<DateRange>(getThisMonth());
  const [report, setReport] = useState<GSTReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [reportType, setReportType] = useState<ReportType>("health");
  const [vendorReport, setVendorReport] = useState<VendorSpendingReport | null>(
    null,
  );
  const [healthReport, setHealthReport] = useState<HealthReport | null>(null);
  const [hsnReport, setHsnReport] = useState<HsnSummaryReport | null>(null);

  const handleFetch = async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      if (reportType === "gst") {
        const data = await fetchGSTReport(
          businessId,
          dateRange.from,
          dateRange.to,
        );
        setReport(data);
      } else if (reportType === "vendor") {
        const data = await fetchVendorSpending(
          businessId,
          dateRange.from,
          dateRange.to,
        );
        setVendorReport(data);
      } else if (reportType === "health") {
        const data = await fetchHealthReport(
          businessId,
          dateRange.from,
          dateRange.to,
        );
        setHealthReport(data);
      } else if (reportType === "hsn") {
        const data = await fetchHsnSummary(
          businessId,
          dateRange.from,
          dateRange.to,
        );
        setHsnReport(data);
      }
      setFetched(true);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleReportTypeChange = (type: ReportType) => {
    setReportType(type);
    setFetched(false);
    setReport(null);
    setVendorReport(null);
    setHealthReport(null);
    setHsnReport(null);
  };

  // Called by GSTTab when user marks an invoice as filed
  const handleMarkFiled = (invoiceId: string, date: string) => {
    setReport((prev) =>
      prev
        ? {
            ...prev,
            invoices: prev.invoices.map((i) =>
              i.id === invoiceId
                ? { ...i, filingStatus: "FILED" as const, gstFilingDate: date }
                : i,
            ),
          }
        : prev,
    );
  };

  const headerDescription =
    reportType === "gst"
      ? "GST invoice summary for filing and compliance"
      : reportType === "vendor"
        ? "Vendor spending analysis by period"
        : reportType === "hsn"
          ? "HSN/SAC wise tax summary for GST filing"
          : "Business financial health overview";

  return (
    <PermissionGate
      permission="report:view"
      fallback={
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
            <FileBarChart className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            You don&apos;t have access to reports.
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reports</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {headerDescription}
            </p>
          </div>

          {/* Tab switcher — full width, equal tabs, icon-only on mobile */}
          <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
            {(
              [
                { type: "health", icon: BriefcaseBusiness, label: "Business Health" },
                { type: "gst",    icon: Sheet,              label: "Invoice Report"  },
                { type: "vendor", icon: ReceiptIndianRupee, label: "Vendor Bills"    },
                { type: "hsn",    icon: MessageSquareText,  label: "HSN Summary"     },
              ] as const
            ).map(({ type, icon: Icon, label }) => (
              <button
                key={type}
                onClick={() => handleReportTypeChange(type)}
                className={`flex flex-1 items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                  reportType === type
                    ? "bg-card text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Filter bar ───────────────────────────────────────────── */}
        <div className="bg-card border border-border rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <DateRangeFilter
            value={dateRange}
            onChange={setDateRange}
            showPresets
            compact
            className="flex-1"
          />
          <button
            onClick={handleFetch}
            disabled={!dateRange.from || !dateRange.to || loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-[0.98] shrink-0"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            {loading ? "Generating…" : "Generate Report"}
          </button>
        </div>

        {/* Loading */}
        {loading && <LoadingState page="default" />}

        {/* Business Health */}
        {!loading && fetched && reportType === "health" && healthReport && (
          <HealthTab report={healthReport} />
        )}

        {/* GST Invoice Report */}
        {!loading && fetched && reportType === "gst" && report && (
          <div className="space-y-6">
            <GSTTab report={report} onMarkFiled={handleMarkFiled} />
          </div>
        )}

        {/* Vendor Spending Report */}
        {!loading && fetched && reportType === "vendor" && vendorReport && (
          <div className="space-y-6">
            <VendorTab report={vendorReport} />
          </div>
        )}

        {!loading && fetched && reportType === "hsn" && hsnReport && (
          <div className="space-y-6">
            <HSNTab report={hsnReport} />
          </div>
        )}

        {/* Pre-fetch empty state */}
        {!loading && !fetched && (
          <div className="bg-card border border-border rounded-2xl flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <FileBarChart className="w-7 h-7 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">
                Select a period and generate
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                {reportType === "gst"
                  ? "Only invoices marked as GST invoices will appear here"
                  : reportType === "vendor"
                    ? "Shows spending grouped by vendor for the selected period"
                    : reportType === "hsn"
                      ? "Shows HSN/SAC code wise taxable value and GST breakup"
                      : "Shows profit, cashflow, and outstanding position for the period"}
              </p>
            </div>
          </div>
        )}
      </div>
    </PermissionGate>
  );
}
