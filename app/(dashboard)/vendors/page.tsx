"use client";

import { useEffect, useState, useMemo } from "react";
import { Download, Building2, FilePlus, RefreshCw } from "lucide-react";

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
import SearchBar from "@/components/ui/SearchBar";
import DateRangeFilter, { DateRange } from "@/components/ui/DateRangeFilter";
import { exportToCSV, fmtCSVDate, fmtCSVAmount } from "@/lib/csv";
import PermissionGate from "@/components/ui/PermissionGate";

type TabType = "Vendors" | "Bills" | "Recurring";

const q = (s: string) => s.toLowerCase();

export default function VendorsPage() {
  const user = getUser();
  const businessId = user?.business?.id;

  const [tab,               setTab]               = useState<TabType>("Vendors");
  const [vendors,           setVendors]           = useState<Vendor[]>([]);
  const [bills,             setBills]             = useState<Bill[]>([]);
  const [recurring,         setRecurring]         = useState<RecurringBill[]>([]);
  const [recurringModalOpen,setRecurringModalOpen]= useState(false);
  const [loading,           setLoading]           = useState(true);
  const [search,            setSearch]            = useState("");
  const [billDateRange,     setBillDateRange]     = useState<DateRange>({ from: "", to: "" });

  const [vendorModalOpen,   setVendorModalOpen]   = useState(false);
  const [billModalOpen,     setBillModalOpen]     = useState(false);
  const [paymentBill,       setPaymentBill]       = useState<Bill | null>(null);

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

  // Reset search when tab changes
  const handleTabChange = (t: TabType) => {
    setTab(t);
    setSearch("");
  };

  // ── Per-tab filtering ────────────────────────────────────────────────────────

  const filteredVendors = useMemo(() => {
    const term = q(search);
    if (!term) return vendors;
    return vendors.filter((v) =>
      q(v.name).includes(term) ||
      q(v.email ?? "").includes(term) ||
      q(v.gstin ?? "").includes(term) ||
      q(v.phone ?? "").includes(term)
    );
  }, [vendors, search]);

  const filteredBills = useMemo(() => {
    const term = q(search);
    return bills.filter((bill) => {
      const due = new Date(bill.dueDate);
      const matchesFrom = !billDateRange.from || due >= new Date(billDateRange.from);
      const matchesTo   = !billDateRange.to   || due <= new Date(billDateRange.to + "T23:59:59");
      const matchesSearch = !term ||
        q(bill.description).includes(term) ||
        q(bill.vendor.name).includes(term) ||
        q(bill.number ?? "").includes(term);
      return matchesFrom && matchesTo && matchesSearch;
    });
  }, [bills, billDateRange, search]);

  const filteredRecurring = useMemo(() => {
    const term = q(search);
    if (!term) return recurring;
    return recurring.filter((r) =>
      q(r.description).includes(term) ||
      q(r.vendor.name).includes(term)
    );
  }, [recurring, search]);

  // ── Actions ──────────────────────────────────────────────────────────────────

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

  const handleBillPaid = (billId: string, newStatus: string, amountPaid: number) => {
    setBills((prev) =>
      prev.map((b) =>
        b.id === billId
          ? { ...b, status: newStatus as Bill["status"], payments: [...(b.payments ?? []), { amount: amountPaid }] }
          : b
      )
    );
  };

  const handleExport = () => {
    if (tab === "Vendors") {
      exportToCSV(
        "vendors",
        ["Name", "Email", "Phone", "GSTIN", "PAN", "State", "City", "Notes"],
        vendors.map((v) => [v.name, v.email ?? "", v.phone ?? "", v.gstin ?? "", v.pan ?? "", v.state ?? "", v.city ?? "", v.notes ?? ""])
      );
      return;
    }
    if (tab === "Bills") {
      exportToCSV(
        "bills",
        ["Description", "Vendor", "Bill No", "Amount", "Due Date", "Paid", "Outstanding", "Status"],
        bills.map((b) => {
          const paid = (b.payments ?? []).reduce((s, p) => s + p.amount, 0);
          return [b.description, b.vendor.name, b.number ?? "", fmtCSVAmount(b.amount), fmtCSVDate(b.dueDate), fmtCSVAmount(paid), fmtCSVAmount(b.amount - paid), b.status];
        })
      );
      return;
    }
    if (tab === "Recurring") {
      exportToCSV(
        "recurring-bills",
        ["Description", "Vendor", "Amount", "Frequency", "Next Due Date", "Status"],
        recurring.map((rb) => [rb.description, rb.vendor.name, fmtCSVAmount(rb.amount), rb.frequency, fmtCSVDate(rb.nextDueDate), rb.isActive ? "Active" : "Paused"])
      );
    }
  };

  if (loading) return <LoadingState page="vendors" />;

  const activeCount = tab === "Vendors" ? filteredVendors.length : tab === "Bills" ? filteredBills.length : filteredRecurring.length;
  const totalCount  = tab === "Vendors" ? vendors.length         : tab === "Bills" ? bills.length         : recurring.length;

  const searchPlaceholders: Record<TabType, string> = {
    Vendors:   "Search vendors by name, email or GSTIN…",
    Bills:     "Search bills by description, vendor or bill number…",
    Recurring: "Search recurring bills by description or vendor…",
  };

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vendors & Payables</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track who you owe and when payments are due</p>
        </div>
        <div className="flex items-center gap-2">
          <PermissionGate permission="report:export">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-card border border-border shadow-sm text-sm font-semibold rounded-lg text-muted-foreground hover:bg-muted transition-all"
            >
              <Download className="h-4 w-4" />Export
            </button>
          </PermissionGate>
          <PermissionGate permission={tab === "Vendors" ? "vendor:create" : "bill:create"}>
            <button
              onClick={() => {
                if (tab === "Vendors") setVendorModalOpen(true);
                if (tab === "Bills") setBillModalOpen(true);
                if (tab === "Recurring") setRecurringModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-sm shadow-primary/15"
            >
              {tab === "Vendors" ? <Building2 className="h-4 w-4" /> : tab === "Bills" ? <FilePlus className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
              {tab === "Vendors" ? "Add Vendor" : tab === "Bills" ? "Add Bill" : "Add Recurring Bill"}
            </button>
          </PermissionGate>
        </div>
      </div>

      <VendorStats vendors={vendors} bills={bills} />

      {/* ── Search + Tabs row ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={searchPlaceholders[tab]}
          className="flex-1"
        />
        <div className="flex items-center gap-1 bg-muted rounded-xl p-1 shrink-0">
          {(["Vendors", "Bills", "Recurring"] as TabType[]).map((t) => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize whitespace-nowrap ${
                tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "Vendors" ? `Vendors (${vendors.length})` : t === "Bills" ? `Bills (${bills.length})` : `Recurring (${recurring.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table card ──────────────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">

        {/* Bills date filter bar */}
        {tab === "Bills" && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border flex-wrap">
            <DateRangeFilter
              value={billDateRange}
              onChange={setBillDateRange}
            />
            {(billDateRange.from || billDateRange.to || search) && (
              <span className="text-xs text-muted-foreground shrink-0">
                {filteredBills.length} of {bills.length} bill{bills.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}

        {/* Vendor search result count */}
        {tab !== "Bills" && search && (
          <div className="px-4 py-2.5 border-b border-border">
            <p className="text-xs text-muted-foreground">
              {activeCount} of {totalCount} {tab.toLowerCase()}{totalCount !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {tab === "Vendors"   && <VendorTable vendors={filteredVendors} onDelete={handleDeleteVendor} />}
        {tab === "Bills"     && <BillTable bills={filteredBills} onPay={setPaymentBill} onDelete={handleDeleteBill} />}
        {tab === "Recurring" && <RecurringBillTable items={filteredRecurring} onToggle={handleToggleRecurring} onDelete={handleDeleteRecurring} />}
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────────── */}
      <AddVendorModal
        isOpen={vendorModalOpen} businessId={businessId!}
        onClose={() => setVendorModalOpen(false)}
        onCreated={(vendor) => setVendors((prev) => [vendor, ...prev])}
      />
      <AddBillModal
        isOpen={billModalOpen} businessId={businessId!} vendors={vendors}
        onClose={() => setBillModalOpen(false)}
        onCreated={(bill) => setBills((prev) => [bill, ...prev])}
      />
      <AddRecurringBillModal
        isOpen={recurringModalOpen} businessId={businessId!} vendors={vendors}
        onClose={() => setRecurringModalOpen(false)}
        onCreated={async (rb) => {
          setRecurring((prev) => [rb, ...prev]);
          if (businessId) setBills(await fetchBills(businessId));
        }}
      />
      <RecordBillPaymentModal
        bill={paymentBill}
        onClose={() => setPaymentBill(null)}
        onPaid={handleBillPaid}
      />
    </div>
  );
}
