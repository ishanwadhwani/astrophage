"use client";

import { useEffect, useState, useMemo } from "react";
import { Download } from "lucide-react";

import { Vendor, Bill, RecurringBill } from "@/types/vendor";
import {
  fetchVendors,
  fetchBills,
  deleteVendor,
  deleteBill,
  fetchRecurringBills,
  toggleRecurringBill,
  deleteRecurringBill,
} from "@/lib/vendors";
import { getUser } from "@/lib/auth";
import VendorStats from "./_components/VendorStats";
import VendorTable from "./_components/VendorTable";
import BillTable from "./_components/BillTable";
import AddVendorModal from "./_components/AddVendorModal";
import AddBillModal from "./_components/AddBillModal";
import RecordBillPaymentModal from "./_components/RecordBillPaymentModal";
import RecurringBillTable from "./_components/RecurringBillTable";
import AddRecurringBillModal from "./_components/AddRecurringBillModal";
import { LoadingState } from "@/components/ui/LoadingState";
import { exportToCSV, fmtCSVDate, fmtCSVAmount } from "@/lib/csv";
import PermissionGate from "@/components/ui/PermissionGate";

type TabType = "Vendors" | "Bills" | "Recurring";

export default function VendorsPage() {
  const user = getUser();
  const businessId = user?.business?.id;

  const [tab, setTab] = useState<TabType>("Vendors");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [recurring, setRecurring] = useState<RecurringBill[]>([]);
  const [recurringModalOpen, setRecurringModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [billDateRange, setBillDateRange] = useState({ from: "", to: "" });

  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [paymentBill, setPaymentBill] = useState<Bill | null>(null);

  useEffect(() => {
    if (!businessId) return;

    const fetchData = async () => {
      try {
        const [v, b, r] = await Promise.all([
          fetchVendors(businessId),
          fetchBills(businessId),
          fetchRecurringBills(businessId),
        ]);
        setVendors(v);
        setBills(b);
        setRecurring(r);
      } catch {
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [businessId]);

  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      const due = new Date(bill.dueDate);
      const matchesFrom =
        !billDateRange.from || due >= new Date(billDateRange.from);
      const matchesTo =
        !billDateRange.to || due <= new Date(billDateRange.to + "T23:59:59");
      return matchesFrom && matchesTo;
    });
  }, [bills, billDateRange]);

  const handleToggleRecurring = async (id: string) => {
    try {
      const updated = await toggleRecurringBill(id);
      setRecurring((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch {}
  };

  const handleDeleteRecurring = async (id: string) => {
    if (!confirm("Delete this recurring bill?")) return;
    try {
      await deleteRecurringBill(id);
      setRecurring((prev) => prev.filter((r) => r.id !== id));
    } catch {}
  };

  const handleDeleteVendor = async (id: string) => {
    if (!confirm("Delete this vendor?")) return;
    try {
      await deleteVendor(id);
      setVendors((prev) => prev.filter((v) => v.id !== id));
    } catch {}
  };

  const handleDeleteBill = async (id: string) => {
    if (!confirm("Delete this bill?")) return;
    try {
      await deleteBill(id);
      setBills((prev) => prev.filter((b) => b.id !== id));
    } catch {}
  };

  const handleBillPaid = (
    billId: string,
    newStatus: string,
    amountPaid: number,
  ) => {
    setBills((prev) =>
      prev.map((b) =>
        b.id === billId
          ? {
              ...b,
              status: newStatus as Bill["status"],
              payments: [...(b.payments ?? []), { amount: amountPaid }],
            }
          : b,
      ),
    );
  };

  const handleExport = () => {
    if (tab === "Vendors") {
      exportToCSV(
        "vendors",
        ["Name", "Email", "Phone", "GSTIN", "PAN", "State", "City", "Notes"],
        vendors.map((v) => [
          v.name,
          v.email ?? "",
          v.phone ?? "",
          v.gstin ?? "",
          v.pan ?? "",
          v.state ?? "",
          v.city ?? "",
          v.notes ?? "",
        ]),
      );
      return;
    }

    if (tab === "Bills") {
      exportToCSV(
        "bills",
        [
          "Description",
          "Vendor",
          "Bill No",
          "Amount",
          "Due Date",
          "Paid",
          "Outstanding",
          "Status",
        ],
        bills.map((b) => {
          const paid = (b.payments ?? []).reduce((s, p) => s + p.amount, 0);
          const outstanding = b.amount - paid;
          return [
            b.description,
            b.vendor.name,
            b.number ?? "",
            fmtCSVAmount(b.amount),
            fmtCSVDate(b.dueDate),
            fmtCSVAmount(paid),
            fmtCSVAmount(outstanding),
            b.status,
          ];
        }),
      );
      return;
    }

    if (tab === "Recurring") {
      exportToCSV(
        "recurring-bills",
        [
          "Description",
          "Vendor",
          "Amount",
          "Frequency",
          "Next Due Date",
          "Status",
        ],
        recurring.map((rb) => [
          rb.description,
          rb.vendor.name,
          fmtCSVAmount(rb.amount),
          rb.frequency,
          fmtCSVDate(rb.nextDueDate),
          rb.isActive ? "Active" : "Paused",
        ]),
      );
    }
  };

  if (loading) return <LoadingState page="vendors" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Vendors & Payables
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track who you owe and when payments are due
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PermissionGate permission="report:export">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 border border-border text-sm font-semibold rounded-lg text-muted-foreground hover:bg-muted transition-all"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </PermissionGate>
          <PermissionGate
            permission={
              tab === "Vendors"
                ? "vendor:create"
                : tab === "Bills"
                  ? "bill:create"
                  : "bill:create"
            }
          >
            <button
              onClick={() => {
                if (tab === "Vendors") setVendorModalOpen(true);
                if (tab === "Bills") setBillModalOpen(true);
                if (tab === "Recurring") setRecurringModalOpen(true);
              }}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-sm shadow-primary/20"
            >
              {tab === "Vendors"
                ? "Add Vendor"
                : tab === "Bills"
                  ? "Add Bill"
                  : "Add Recurring Bill"}
            </button>
          </PermissionGate>
        </div>
      </div>

      <VendorStats vendors={vendors} bills={bills} />

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-muted rounded-xl p-1 w-fit">
        {(["Vendors", "Bills", "Recurring"] as TabType[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
              tab === t
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "Vendors"
              ? `Vendors (${vendors.length})`
              : t === "Bills"
                ? `Bills (${bills.length})`
                : `Recurring (${recurring.length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {tab === "Vendors" && (
          <VendorTable vendors={vendors} onDelete={handleDeleteVendor} />
        )}

        {tab === "Bills" && (
          <div className="flex items-center gap-2 p-4">
            <span className="text-xs text-muted-foreground">Due date:</span>
            <input
              type="date"
              value={billDateRange.from}
              onChange={(e) =>
                setBillDateRange((p) => ({ ...p, from: e.target.value }))
              }
              className="px-3 py-2 bg-card border border-input rounded-lg text-sm outline-none focus:border-primary transition"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <input
              type="date"
              value={billDateRange.to}
              onChange={(e) =>
                setBillDateRange((p) => ({ ...p, to: e.target.value }))
              }
              className="px-3 py-2 bg-card border border-input rounded-lg text-sm outline-none focus:border-primary transition"
            />
            {(billDateRange.from || billDateRange.to) && (
              <button
                onClick={() => setBillDateRange({ from: "", to: "" })}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {tab === "Bills" && (
          <>
            <BillTable
              bills={bills}
              onPay={setPaymentBill}
              onDelete={handleDeleteBill}
            />
          </>
        )}

        {tab === "Recurring" && (
          <RecurringBillTable
            items={recurring}
            onToggle={handleToggleRecurring}
            onDelete={handleDeleteRecurring}
          />
        )}
      </div>

      {/* Modals */}
      <AddVendorModal
        isOpen={vendorModalOpen}
        businessId={businessId!}
        onClose={() => setVendorModalOpen(false)}
        onCreated={(vendor) => setVendors((prev) => [vendor, ...prev])}
      />

      <AddBillModal
        isOpen={billModalOpen}
        businessId={businessId!}
        vendors={vendors}
        onClose={() => setBillModalOpen(false)}
        onCreated={(bill) => setBills((prev) => [bill, ...prev])}
      />

      <AddRecurringBillModal
        isOpen={recurringModalOpen}
        businessId={businessId!}
        vendors={vendors}
        onClose={() => setRecurringModalOpen(false)}
        onCreated={(rb) => setRecurring((prev) => [rb, ...prev])}
      />

      <RecordBillPaymentModal
        bill={paymentBill}
        onClose={() => setPaymentBill(null)}
        onPaid={handleBillPaid}
      />
    </div>
  );
}
