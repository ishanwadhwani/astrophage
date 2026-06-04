"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { VendorDetail, BillWithPayments } from "@/types/vendor";
import { fetchVendorDetail } from "@/lib/vendors";
import { getUser } from "@/lib/auth";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyCell } from "@/components/ui/EmptyCell";
import DataTable, { TableColumn } from "@/components/shared/DataTable";

const fmt = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2 });

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const statusStyles: Record<string, string> = {
  PENDING: "bg-status-pending text-status-pending-foreground",
  PAID: "bg-status-paid text-status-paid-foreground",
  OVERDUE: "bg-status-overdue text-status-overdue-foreground",
  CANCELLED: "bg-status-cancelled text-status-cancelled-foreground",
};

const PAYMENT_MODE_LABELS: Record<string, string> = {
  CASH: "Cash",
  UPI: "UPI",
  BANK_TRANSFER: "Bank Transfer",
  CARD: "Card",
};

export default function VendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = getUser();
  const businessId = user?.business?.id;

  const [data, setData] = useState<VendorDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId || !id) return;

    const fetchData = async () => {
      try {
        const result = await fetchVendorDetail(id, businessId);
        setData(result);
      } catch {
        router.push("/vendors");
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [id, businessId, router]);

  if (loading) return <LoadingState page="vendors" />;
  if (!data) return null;

  const { vendor, bills, summary } = data;

  const billColumns: TableColumn<BillWithPayments>[] = [
    {
      key: "description",
      header: "Description",
      render: (bill) => (
        <div>
          <p className="font-medium text-foreground">{bill.description}</p>
          {bill.number && (
            <p className="text-xs text-muted-foreground">#{bill.number}</p>
          )}
        </div>
      ),
    },
    {
      key: "dueDate",
      header: "Due Date",
      render: (bill) => (
        <span className="text-muted-foreground whitespace-nowrap">
          {fmtDate(bill.dueDate)}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (bill) => (
        <span className="font-medium text-foreground tabular-nums">
          {fmt(bill.amount)}
        </span>
      ),
    },
    {
      key: "paid",
      header: "Paid",
      align: "right",
      render: (bill) => {
        const paid = bill.payments.reduce((s, p) => s + p.amount, 0);
        return (
          <span className="text-status-paid-foreground tabular-nums">
            {fmt(paid)}
          </span>
        );
      },
    },
    {
      key: "outstanding",
      header: "Outstanding",
      align: "right",
      render: (bill) => {
        const paid = bill.payments.reduce((s, p) => s + p.amount, 0);
        const outstanding = bill.amount - paid;
        return (
          <span
            className={`font-semibold tabular-nums ${
              outstanding > 0
                ? "text-status-overdue-foreground"
                : "text-status-paid-foreground"
            }`}
          >
            {fmt(outstanding)}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (bill) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyles[bill.status]}`}
        >
          {bill.status}
        </span>
      ),
    },
    {
      key: "payments",
      header: "Payments",
      render: (bill) => (
        <span className="text-xs text-muted-foreground">
          {bill.payments.length} payment{bill.payments.length !== 1 ? "s" : ""}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/vendors"
          className="flex items-center justify-center w-8 h-8 rounded-lg border border-border text-muted-foreground hover:bg-muted transition"
        >
          ←
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{vendor.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Vendor details and payment history
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Total Billed
          </p>
          <p className="text-2xl font-bold text-foreground">
            {fmt(summary.totalBilled)}
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Total Paid
          </p>
          <p className="text-2xl font-bold text-status-paid-foreground">
            {fmt(summary.totalPaid)}
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Outstanding
          </p>
          <p
            className={`text-2xl font-bold ${
              summary.outstanding > 0
                ? "text-status-overdue-foreground"
                : "text-foreground"
            }`}
          >
            {fmt(summary.outstanding)}
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* vendor info */}
        <div className="w-full lg:w-72 shrink-0 space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Vendor Info
            </h2>
            {[
              { label: "Email", value: vendor.email },
              { label: "Phone", value: vendor.phone },
              { label: "GSTIN", value: vendor.gstin },
              { label: "PAN", value: vendor.pan },
              { label: "State", value: vendor.state },
              { label: "City", value: vendor.city },
              { label: "Pincode", value: vendor.pincode },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium text-foreground mt-0.5">
                  {value ?? <EmptyCell />}
                </p>
              </div>
            ))}
            {vendor.address && (
              <div>
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="text-sm font-medium text-foreground mt-0.5">
                  {vendor.address}
                </p>
              </div>
            )}
            {vendor.notes && (
              <div>
                <p className="text-xs text-muted-foreground">Notes</p>
                <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                  {vendor.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* bills */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">
                Bills ({bills.length})
              </h2>
            </div>
            <DataTable
              columns={billColumns}
              data={bills}
              keyExtractor={(b) => b.id}
              emptyText="No bills for this vendor yet."
            />
          </div>

          {/* Payment history across all bills */}
          {bills.some((b) => b.payments.length > 0) && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">
                  Payment History
                </h2>
              </div>
              <div className="divide-y divide-border">
                {bills
                  .flatMap((bill) =>
                    bill.payments.map((p) => ({
                      ...p,
                      billDescription: bill.description,
                    })),
                  )
                  .sort(
                    (a, b) =>
                      new Date(b.paymentDate).getTime() -
                      new Date(a.paymentDate).getTime(),
                  )
                  .map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between px-6 py-4"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {PAYMENT_MODE_LABELS[payment.mode]}
                          {payment.referenceNumber && (
                            <span className="text-muted-foreground font-normal">
                              {" "}
                              · {payment.referenceNumber}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {payment.billDescription} ·{" "}
                          {fmtDate(payment.paymentDate)}
                        </p>
                      </div>
                      <span className="font-semibold text-foreground tabular-nums">
                        {fmt(payment.amount)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
