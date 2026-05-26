"use client";

import { useEffect, useState } from "react";
import { Vendor, Bill } from "@/types/vendor";
import {
  fetchVendors,
  fetchBills,
  deleteVendor,
  deleteBill,
} from "@/lib/vendors";
import { getUser } from "@/lib/auth";
import VendorStats from "./_components/VendorStats";
import VendorTable from "./_components/VendorTable";
import BillTable from "./_components/BillTable";
import AddVendorModal from "./_components/AddVendorModal";
import AddBillModal from "./_components/AddBillModal";
import RecordBillPaymentModal from "./_components/RecordBillPaymentModal";

type TabType = "vendors" | "bills";

export default function VendorsPage() {
  const user = getUser();
  const businessId = user?.business?.id;

  const [tab, setTab] = useState<TabType>("vendors");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [paymentBill, setPaymentBill] = useState<Bill | null>(null);

  useEffect(() => {
    if (!businessId) return;

    const fetchData = async () => {
      try {
        const [v, b] = await Promise.all([
          fetchVendors(businessId),
          fetchBills(businessId),
        ]);
        setVendors(v);
        setBills(b);
      } catch {
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [businessId]);

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
          onClick={() =>
            tab === "vendors"
              ? setVendorModalOpen(true)
              : setBillModalOpen(true)
          }
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-sm shadow-primary/20"
        >
          {tab === "vendors" ? "Add Vendor" : "Add Bill"}
        </button>
      </div>

      <VendorStats vendors={vendors} bills={bills} />

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-muted rounded-xl p-1 w-fit">
        {(["vendors", "bills"] as TabType[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
              tab === t
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "vendors"
              ? `Vendors (${vendors.length})`
              : `Bills (${bills.length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {tab === "vendors" ? (
          <VendorTable vendors={vendors} onDelete={handleDeleteVendor} />
        ) : (
          <BillTable
            bills={bills}
            onPay={setPaymentBill}
            onDelete={handleDeleteBill}
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

      <RecordBillPaymentModal
        bill={paymentBill}
        onClose={() => setPaymentBill(null)}
        onPaid={handleBillPaid}
      />
    </div>
  );
}
