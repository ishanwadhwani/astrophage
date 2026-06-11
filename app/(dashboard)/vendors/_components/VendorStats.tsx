"use client";

import { Building2, CreditCard, AlertTriangle, Receipt } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Vendor, Bill } from "@/types/vendor";

const fmt = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2 });

const getOutstanding = (bill: Bill) => {
  const paid = (bill.payments ?? []).reduce((s, p) => s + p.amount, 0);
  return bill.amount - paid;
};

const STATUS_COLORS = {
  PENDING: "#D97706",
  OVERDUE: "#DC2626",
  PAID: "#16A34A",
  CANCELLED: "#64748B",
};

interface Props {
  vendors: Vendor[];
  bills: Bill[];
}

export default function VendorStats({ vendors, bills }: Props) {
  const totalPayables = bills
    .filter((b) => b.status !== "PAID" && b.status !== "CANCELLED")
    .reduce((s, b) => s + getOutstanding(b), 0);

  const overduePayables = bills
    .filter((b) => b.status === "OVERDUE")
    .reduce((s, b) => s + getOutstanding(b), 0);

  const openBills = bills.filter(
    (b) => b.status === "PENDING" || b.status === "OVERDUE",
  ).length;

  const chartData = (
    ["PENDING", "OVERDUE", "PAID", "CANCELLED"] as const
  )
    .map((s) => ({
      name: s.charAt(0) + s.slice(1).toLowerCase(),
      value: bills.filter((b) => b.status === s).length,
      color: STATUS_COLORS[s],
    }))
    .filter((d) => d.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* KPI cards — left 2/3 */}
      <div className="lg:col-span-2 grid grid-cols-2 gap-4 min-w-0">
        {/* Total Vendors */}
        <div className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Total Vendors
          </p>
          <p className="text-3xl font-bold text-foreground tabular-nums">
            {vendors.length}
          </p>
          <div className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-chart-1/10 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-chart-1" />
          </div>
        </div>

        {/* Total Payables */}
        <div className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Total Payables
          </p>
          <p className="text-3xl font-bold text-foreground tabular-nums">
            {fmt(totalPayables)}
          </p>
          <div className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-chart-2/10 flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-chart-2" />
          </div>
        </div>

        {/* Overdue Bills */}
        <div
          className={`bg-card border rounded-2xl p-5 relative overflow-hidden ${
            overduePayables > 0
              ? "border-status-overdue-foreground/20"
              : "border-border"
          }`}
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Overdue Bills
          </p>
          <p
            className={`text-3xl font-bold tabular-nums ${
              overduePayables > 0
                ? "text-status-overdue-foreground"
                : "text-foreground"
            }`}
          >
            {fmt(overduePayables)}
          </p>
          <div
            className={`absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center ${
              overduePayables > 0 ? "bg-status-overdue" : "bg-muted"
            }`}
          >
            <AlertTriangle
              className={`w-4 h-4 ${
                overduePayables > 0
                  ? "text-status-overdue-foreground"
                  : "text-muted-foreground"
              }`}
            />
          </div>
        </div>

        {/* Open Bills */}
        <div className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Open Bills
          </p>
          <p className="text-3xl font-bold text-foreground tabular-nums">
            {openBills}
          </p>
          <div className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-chart-4/10 flex items-center justify-center">
            <Receipt className="w-4 h-4 text-chart-4" />
          </div>
        </div>
      </div>

      {/* Chart card — right 1/3 */}
      <div className="bg-card border border-border rounded-2xl p-5 flex flex-col min-w-0 overflow-hidden">
        <div className="mb-3">
          <p className="text-sm font-semibold text-foreground">Bills Breakdown</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {bills.length} bills total
          </p>
        </div>

        {chartData.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">No bills yet</p>
          </div>
        ) : (
          <>
            <div className="w-full overflow-hidden">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={64}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            </div>

            <div className="mt-3 space-y-1.5">
              {chartData.map((entry) => (
                <div
                  key={entry.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: entry.color }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {entry.name}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-foreground tabular-nums">
                    {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
