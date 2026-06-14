"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useForm, Controller } from "react-hook-form";
import {
  ArrowLeft, Send, Ban, IndianRupee, CheckCircle2, Clock,
  Building2, User, Calendar, Loader2, Receipt, CreditCard,
  Banknote, Smartphone, FileText, QrCode, MapPin, FileCheck,
} from "lucide-react";

import { Invoice, Payment, PaymentMode } from "@/types/invoice";
import { fetchInvoice, updateInvoiceStatus, recordPayment } from "@/lib/invoices";
import { PAYMENT_MODES } from "@/constants/invoice-options";

const InvoiceDownloadButton = dynamic(
  () => import("@/components/shared/InvoiceDownloadButton"),
  {
    ssr: false,
    loading: () => (
      <button className="px-4 py-2 border border-border text-sm rounded-xl opacity-50 bg-card">
        Loading PDF…
      </button>
    ),
  },
);

import { openWhatsApp, invoiceReminderMessage } from "@/lib/whatsapp";
import { getUser } from "@/lib/auth";
import { LoadingState } from "@/components/ui/LoadingState";
import { useToast } from "@/components/ui/Toast";
import SendInvoiceModal from "../_components/SendInvoiceModal";
import PermissionGate from "@/components/ui/PermissionGate";
import { CopyButton } from "@/components/ui/CopyButton";

// ── Types ────────────────────────────────────────────────────────────────────

type RecordPaymentForm = {
  amount: number;
  mode: PaymentMode;
  referenceNumber: string;
  paymentDate: string;
  notes: string;
};

// ── Config maps ──────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; badge: string; dot: string; pulse: boolean }> = {
  DRAFT:     { label: "Draft",     dot: "bg-muted-foreground/50",        badge: "bg-status-draft text-status-draft-foreground border-status-draft-foreground/15",         pulse: false },
  PENDING:   { label: "Pending",   dot: "bg-status-pending-foreground",  badge: "bg-status-pending text-status-pending-foreground border-status-pending-foreground/20",   pulse: true  },
  PAID:      { label: "Paid",      dot: "bg-status-paid-foreground",     badge: "bg-status-paid text-status-paid-foreground border-status-paid-foreground/20",             pulse: false },
  OVERDUE:   { label: "Overdue",   dot: "bg-status-overdue-foreground",  badge: "bg-status-overdue text-status-overdue-foreground border-status-overdue-foreground/20",   pulse: true  },
  CANCELLED: { label: "Cancelled", dot: "bg-destructive/50",             badge: "bg-status-cancelled text-status-cancelled-foreground border-status-cancelled-foreground/15", pulse: false },
};

type ModeConfig = { icon: React.ElementType; label: string; bg: string; text: string };
const MODE_CFG: Record<PaymentMode, ModeConfig> = {
  CASH:          { icon: Banknote,   label: "Cash",          bg: "bg-chart-3/10", text: "text-chart-3" },
  UPI:           { icon: Smartphone, label: "UPI",           bg: "bg-primary/10", text: "text-primary" },
  BANK_TRANSFER: { icon: Building2,  label: "Bank Transfer", bg: "bg-chart-1/10", text: "text-chart-1" },
  CARD:          { icon: CreditCard, label: "Card",          bg: "bg-chart-4/10", text: "text-chart-4" },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2 });
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-foreground leading-snug">{value}</p>
    </div>
  );
}

// ── Page component ────────────────────────────────────────────────────────────

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = getUser();
  const router = useRouter();

  const { confirm } = useToast();
  const [invoice,       setInvoice]       = useState<Invoice | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [serverError,   setServerError]   = useState("");
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [qrDataUrl,     setQrDataUrl]     = useState<string | undefined>();
  const [mounted,       setMounted]       = useState(false);

  const totalPaid   = invoice?.payments.reduce((s, p) => s + p.amount, 0) ?? 0;
  const outstanding = (invoice?.total ?? 0) - totalPaid;
  const paymentPct  = invoice && invoice.total > 0 ? Math.min((totalPaid / invoice.total) * 100, 100) : 0;

  const today = new Date().toISOString().split("T")[0];

  const {
    register, control, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<RecordPaymentForm>({
    defaultValues: {
      amount: 0, mode: "BANK_TRANSFER",
      referenceNumber: "", paymentDate: today, notes: "",
    },
  });

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const data = await fetchInvoice(id);
        setInvoice(data);
      } catch {
        router.push("/invoices");
      } finally {
        setLoading(false);
        setTimeout(() => setMounted(true), 60);
      }
    };
    void load();
  }, [id, router]);

  useEffect(() => {
    if (outstanding > 0) reset((prev) => ({ ...prev, amount: outstanding }));
  }, [outstanding, reset]);

  const onRecordPayment = async (values: RecordPaymentForm) => {
    if (!invoice) return;
    setServerError("");
    try {
      const result = await recordPayment({
        invoiceId: invoice.id,
        amount: values.amount,
        mode: values.mode,
        referenceNumber: values.referenceNumber || undefined,
        paymentDate: values.paymentDate || undefined,
        notes: values.notes || undefined,
      });
      setInvoice((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: result.invoiceStatus as Invoice["status"],
          payments: [
            ...prev.payments,
            {
              id: result.payment.id,
              invoiceId: prev.id,
              amount: values.amount,
              mode: values.mode,
              referenceNumber: values.referenceNumber || null,
              paymentDate: values.paymentDate || new Date().toISOString(),
              notes: values.notes || null,
            } as Payment,
          ],
        };
      });
      reset({ amount: result.outstanding, mode: "BANK_TRANSFER", referenceNumber: "", paymentDate: today, notes: "" });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Failed to record payment");
    }
  };

  const handleCancel = async () => {
    if (!invoice) return;
    const ok = await confirm({
      title: "Cancel Invoice?",
      message: "This invoice will be marked as cancelled. This action cannot be undone.",
      confirmText: "Cancel Invoice",
      cancelText: "Keep Invoice",
      danger: true,
    });
    if (!ok) return;
    try {
      const updated = await updateInvoiceStatus(invoice.id, "CANCELLED");
      setInvoice((prev) => (prev ? { ...prev, status: updated.status } : prev));
    } catch {}
  };

  if (loading) return <LoadingState page="invoiceDetail" />;
  if (!invoice) return null;

  const canRecordPayment = invoice.status !== "PAID" && invoice.status !== "CANCELLED";
  const statusCfg = STATUS_CFG[invoice.status] ?? STATUS_CFG.DRAFT;

  const animCls = `transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`;

  const inp = "w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-sm text-foreground outline-none transition-all duration-150 placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/10";
  const lbl = "block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5";

  return (
    <div className="min-h-full space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className={`flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${animCls}`}>
        <div className="flex items-start gap-3">
          <Link
            href="/invoices"
            className="mt-0.5 flex items-center justify-center w-9 h-9 rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-all shadow-sm shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">Invoice #{invoice.number}</h1>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusCfg.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusCfg.dot} ${statusCfg.pulse ? "animate-pulse" : ""}`} />
                {statusCfg.label}
              </span>
              {invoice.isGstInvoice && (
                <span className="px-2 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                  GST
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Created {new Date(invoice.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {invoice.status !== "CANCELLED" && invoice.status !== "PAID" && (
            <PermissionGate permission="invoice:edit">
              <button
                onClick={handleCancel}
                className="flex items-center gap-1.5 px-3.5 py-2 border border-border text-sm font-medium rounded-xl bg-card text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all shadow-sm"
              >
                <Ban className="w-3.5 h-3.5" />
                Cancel
              </button>
            </PermissionGate>
          )}

          <PermissionGate permission="invoice:create">
            <button
              onClick={() => setSendModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-card border border-border text-sm font-semibold rounded-xl text-muted-foreground hover:bg-muted transition-all shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              Send Email
            </button>
          </PermissionGate>

          {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && invoice.client.phone && (
            <button
              onClick={() =>
                openWhatsApp(
                  invoice.client.phone,
                  invoiceReminderMessage(
                    {
                      id: invoice.id,
                      number: invoice.number,
                      clientName: invoice.client.name,
                      clientPhone: invoice.client.phone,
                      total: invoice.total,
                      outstanding: invoice.total - invoice.payments.reduce((s, p) => s + p.amount, 0),
                      dueDate: invoice.dueDate,
                      status: invoice.status,
                    },
                    user?.business?.name ?? "",
                  ),
                )
              }
              className="flex items-center gap-2 px-3.5 py-2 border border-[#25D366]/40 text-[#25D366] text-sm font-semibold rounded-xl hover:bg-[#25D366]/10 transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Remind
            </button>
          )}

          <InvoiceDownloadButton
            invoice={invoice}
            onQRReady={(url) => setQrDataUrl(url)}
          />
        </div>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {([
          {
            icon: IndianRupee,
            iconBg: "bg-chart-1/10 text-chart-1",
            label: "Invoice Total",
            value: fmt(invoice.total),
            sub: `${invoice.lineItems.length} line item${invoice.lineItems.length !== 1 ? "s" : ""}`,
            delay: "50ms",
          },
          {
            icon: CheckCircle2,
            iconBg: totalPaid > 0 ? "bg-status-paid/80 text-status-paid-foreground" : "bg-muted text-muted-foreground",
            label: "Amount Paid",
            value: fmt(totalPaid),
            sub: totalPaid > 0 ? `${Math.round(paymentPct)}% of total` : "No payments yet",
            delay: "100ms",
          },
          {
            icon: outstanding > 0 ? Clock : CheckCircle2,
            iconBg: outstanding > 0
              ? "bg-status-overdue/60 text-status-overdue-foreground"
              : "bg-status-paid/80 text-status-paid-foreground",
            label: "Outstanding",
            value: fmt(outstanding),
            sub: outstanding > 0 ? `Due ${fmtDate(invoice.dueDate)}` : "Fully settled",
            delay: "150ms",
          },
        ] as const).map((card, i) => (
          <div
            key={i}
            style={{ transitionDelay: card.delay }}
            className={`bg-card border border-border rounded-2xl p-5 flex items-start gap-4 shadow-sm hover:-translate-y-0.5 hover:shadow-md ${animCls}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}>
              <card.icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
              <p className="text-xl font-bold text-foreground mt-0.5 tabular-nums">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Payment progress strip */}
      {totalPaid > 0 && invoice.total > 0 && (
        <div className={`-mt-2 transition-opacity duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}>
          <div className="h-1 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-status-paid-foreground rounded-full transition-all duration-700"
              style={{ transitionDelay: "300ms", width: mounted ? `${paymentPct}%` : "0%" }}
            />
          </div>
        </div>
      )}

      {/* ── Two-column layout ───────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* ── Left: main content ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* From / Billed To */}
          <div
            style={{ transitionDelay: "120ms" }}
            className={`bg-card border border-border rounded-2xl overflow-hidden ${animCls}`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
              <div className="p-6">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-chart-1/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-3.5 h-3.5 text-chart-1" />
                  </div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">From</p>
                </div>
                <div className="space-y-3">
                  <InfoRow label="Business" value={invoice.business?.name} />
                  <InfoRow label="GSTIN" value={invoice.business?.gstin} />
                  <InfoRow label="PAN" value={invoice.business?.pan} />
                  <InfoRow
                    label="Address"
                    value={[invoice.business?.address, invoice.business?.city, invoice.business?.state, invoice.business?.pincode]
                      .filter(Boolean).join(", ")}
                  />
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Billed To</p>
                </div>
                <div className="space-y-3">
                  <InfoRow label="Client" value={invoice.client.name} />
                  <InfoRow label="GSTIN" value={invoice.client.gstin ?? undefined} />
                  <InfoRow label="PAN" value={invoice.client.pan ?? undefined} />
                  <InfoRow
                    label="Address"
                    value={[invoice.client.address, invoice.client.city, invoice.client.state]
                      .filter(Boolean).join(", ")}
                  />
                </div>
              </div>
            </div>

            {/* Meta strip */}
            <div className="px-6 py-4 border-t border-border bg-muted/30 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: Calendar,   label: "Invoice Date",    value: fmtDate(invoice.invoiceDate) },
                { icon: Clock,      label: "Due Date",        value: fmtDate(invoice.dueDate) },
                { icon: MapPin,     label: "Place of Supply", value: invoice.placeOfSupply || "—" },
                { icon: FileCheck,  label: "Tax Type",        value: invoice.taxType === "IGST" ? "IGST" : "CGST + SGST" },
              ].map((m) => (
                <div key={m.label} className="flex items-center gap-2">
                  <m.icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{m.label}</p>
                    <p className="text-xs font-semibold text-foreground mt-0.5">{m.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Line Items */}
          <div
            style={{ transitionDelay: "160ms" }}
            className={`bg-card border border-border rounded-2xl overflow-hidden ${animCls}`}
          >
            <div className="px-6 py-4 border-b border-border flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-chart-2/10 flex items-center justify-center shrink-0">
                <Receipt className="w-3.5 h-3.5 text-chart-2" />
              </div>
              <h2 className="text-sm font-bold text-foreground">Line Items</h2>
              <span className="ml-auto text-xs text-muted-foreground">
                {invoice.lineItems.length} item{invoice.lineItems.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">HSN/SAC</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Qty</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rate</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">GST%</th>
                    {invoice.taxType === "IGST" ? (
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">IGST</th>
                    ) : (
                      <>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">CGST</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">SGST</th>
                      </>
                    )}
                    <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {invoice.lineItems.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors duration-100">
                      <td className="px-6 py-4 font-medium text-foreground">{item.description}</td>
                      <td className="px-4 py-4 font-mono text-xs text-muted-foreground">{item.hsnSac || "—"}</td>
                      <td className="px-4 py-4 text-right text-muted-foreground tabular-nums">{item.quantity}</td>
                      <td className="px-4 py-4 text-right text-muted-foreground tabular-nums">
                        ₹{item.rate.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground">
                          {item.gstRate}%
                        </span>
                      </td>
                      {invoice.taxType === "IGST" ? (
                        <td className="px-4 py-4 text-right text-muted-foreground tabular-nums">{fmt(item.igst)}</td>
                      ) : (
                        <>
                          <td className="px-4 py-4 text-right text-muted-foreground tabular-nums">{fmt(item.cgst)}</td>
                          <td className="px-4 py-4 text-right text-muted-foreground tabular-nums">{fmt(item.sgst)}</td>
                        </>
                      )}
                      <td className="px-6 py-4 text-right font-bold text-foreground tabular-nums">{fmt(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="px-6 py-5 border-t border-border bg-muted/20">
              <div className="flex flex-col items-end gap-2 text-sm">
                <div className="flex justify-between w-56 text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="tabular-nums font-medium">{fmt(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between w-56 text-muted-foreground">
                  <span>Total Tax</span>
                  <span className="tabular-nums font-medium">{fmt(invoice.totalTax)}</span>
                </div>
                <div className="flex justify-between w-56 pt-3 mt-1 border-t border-border font-bold text-foreground text-base">
                  <span>Total</span>
                  <span className="text-primary tabular-nums">{fmt(invoice.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          {invoice.business?.bankDetails && (
            <div
              style={{ transitionDelay: "200ms" }}
              className={`bg-card border border-border rounded-2xl p-6 ${animCls}`}
            >
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-7 h-7 rounded-lg bg-chart-4/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-3.5 h-3.5 text-chart-4" />
                </div>
                <h2 className="text-sm font-bold text-foreground">Bank Details</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <InfoRow label="Bank"           value={invoice.business.bankDetails.bankName} />
                <InfoRow label="Account Name"   value={invoice.business.bankDetails.accountName} />
                <InfoRow label="Account Number" value={invoice.business.bankDetails.accountNumber} />
                <InfoRow label="IFSC"           value={invoice.business.bankDetails.ifsc} />
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div
              style={{ transitionDelay: "220ms" }}
              className={`bg-card border border-border rounded-2xl p-6 ${animCls}`}
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <h2 className="text-sm font-bold text-foreground">Notes</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed pl-9">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* ── Right Sidebar ──────────────────────────────────────────────────── */}
        <div className="w-full lg:w-80 shrink-0 lg:sticky lg:top-6 space-y-4">

          {/* UPI QR */}
          {qrDataUrl && invoice.business.upiId && (
            <div
              style={{ transitionDelay: "130ms" }}
              className={`bg-card border border-border rounded-2xl overflow-hidden ${animCls}`}
            >
              <div className="px-5 py-4 border-b border-border flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <QrCode className="w-3.5 h-3.5 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Pay via UPI</h3>
              </div>
              <div className="p-5 flex flex-col items-center gap-3">
                <div className="p-3 rounded-2xl bg-white border border-border shadow-sm">
                  <img src={qrDataUrl} alt="UPI QR Code" className="w-36 h-36" />
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <p className="text-xs font-mono font-bold text-foreground">{invoice.business.upiId}</p>
                    <CopyButton text={invoice.business.upiId!} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Scan with any UPI app</p>
                  <p className="text-base font-bold text-primary mt-1.5 tabular-nums">
                    {fmt(outstanding > 0 ? outstanding : invoice.total)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  {["GPay", "PhonePe", "Paytm", "BHIM"].map((app) => (
                    <span key={app} className="px-2 py-0.5 bg-muted rounded-md text-[10px] text-muted-foreground font-semibold">
                      {app}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Record Payment */}
          <PermissionGate permission="invoice:payment">
            {canRecordPayment && (
              <div
                style={{ transitionDelay: "150ms" }}
                className={`bg-card border border-border rounded-2xl overflow-hidden ${animCls}`}
              >
                <div className="px-5 py-4 border-b border-border flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-chart-3/10 flex items-center justify-center shrink-0">
                    <Banknote className="w-3.5 h-3.5 text-chart-3" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">Record Payment</h3>
                </div>

                <form onSubmit={handleSubmit(onRecordPayment)} noValidate className="p-5 space-y-4">
                  <div>
                    <label className={lbl}>Amount (₹) <span className="text-destructive">*</span></label>
                    <input
                      type="number" min="1" step="0.01"
                      {...register("amount", {
                        required: "Amount is required",
                        min: { value: 1, message: "Minimum ₹1" },
                        valueAsNumber: true,
                      })}
                      className={errors.amount ? `${inp} border-destructive bg-destructive/5` : inp}
                    />
                    {errors.amount && <p className="text-xs text-destructive mt-1">{errors.amount.message}</p>}
                  </div>

                  <div>
                    <label className={lbl}>Payment Mode <span className="text-destructive">*</span></label>
                    <Controller
                      name="mode" control={control}
                      rules={{ required: "Select payment mode" }}
                      render={({ field }) => (
                        <select {...field} className={inp}>
                          {PAYMENT_MODES.map((m) => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                          ))}
                        </select>
                      )}
                    />
                  </div>

                  <div>
                    <label className={lbl}>Reference No.</label>
                    <input
                      type="text" placeholder="UTR / transaction ID"
                      {...register("referenceNumber")}
                      className={inp}
                    />
                  </div>

                  <div>
                    <label className={lbl}>Payment Date</label>
                    <input type="date" {...register("paymentDate")} className={inp} />
                  </div>

                  <div>
                    <label className={lbl}>Notes</label>
                    <input
                      type="text" placeholder="Optional note"
                      {...register("notes")}
                      className={inp}
                    />
                  </div>

                  {serverError && (
                    <p className="text-xs text-destructive bg-destructive/5 px-3 py-2 rounded-lg border border-destructive/10">
                      {serverError}
                    </p>
                  )}

                  <button
                    type="submit" disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm shadow-primary/20 active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />Recording…</>
                    ) : "Record Payment"}
                  </button>
                </form>
              </div>
            )}
          </PermissionGate>

          {/* Payment History */}
          {invoice.payments.length > 0 && (
            <div
              style={{ transitionDelay: "170ms" }}
              className={`bg-card border border-border rounded-2xl overflow-hidden ${animCls}`}
            >
              <div className="px-5 py-4 border-b border-border flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-chart-4/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-chart-4" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Payment History</h3>
                <span className="ml-auto text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                  {invoice.payments.length}
                </span>
              </div>
              <div className="divide-y divide-border/60">
                {invoice.payments.map((payment) => {
                  const mc = MODE_CFG[payment.mode];
                  const Icon = mc?.icon ?? Banknote;
                  return (
                    <div key={payment.id} className="px-5 py-4 hover:bg-muted/30 transition-colors duration-100">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${mc?.bg ?? "bg-muted"} ${mc?.text ?? "text-muted-foreground"}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-foreground tabular-nums">{fmt(payment.amount)}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {mc?.label ?? payment.mode}
                              {payment.referenceNumber && ` · ${payment.referenceNumber}`}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
                          {new Date(payment.paymentDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                      {payment.notes && (
                        <p className="text-xs text-muted-foreground mt-2 pl-11">{payment.notes}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <SendInvoiceModal
        isOpen={sendModalOpen}
        invoiceId={invoice.id}
        invoiceNumber={invoice.number}
        defaultEmail={invoice.client.email ?? ""}
        onClose={() => setSendModalOpen(false)}
      />
    </div>
  );
}
