"use client";

import { useEffect, useState } from "react";
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

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

        {/* Assuming your second tab is called "Bills" */}
        {tab === "Bills" && (
          <BillTable
            bills={bills}
            onPay={setPaymentBill}
            onDelete={handleDeleteBill}
          />
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
        businessId={businessId}
        onClose={() => setVendorModalOpen(false)}
        onCreated={(vendor) => setVendors((prev) => [vendor, ...prev])}
      />

      <AddBillModal
        isOpen={billModalOpen}
        businessId={businessId}
        vendors={vendors}
        onClose={() => setBillModalOpen(false)}
        onCreated={(bill) => setBills((prev) => [bill, ...prev])}
      />

      <AddRecurringBillModal
        isOpen={recurringModalOpen}
        businessId={businessId}
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
