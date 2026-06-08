"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useForm, Controller } from "react-hook-form";
import { Send } from "lucide-react";

import { Invoice, Payment, PaymentMode } from "@/types/invoice";
import { fetchInvoice, updateInvoiceStatus } from "@/lib/invoices";
import { recordPayment } from "@/lib/invoices";
import { PAYMENT_MODES } from "@/constants/invoice-options";
const InvoiceDownloadButton = dynamic(
  () => import("@/components/shared/InvoiceDownloadButton"),
  {
    ssr: false,
    loading: () => (
      <button className="px-4 py-2 border border-border text-sm rounded-lg opacity-50">
        Loading PDF...
      </button>
    ),
  },
);
import { openWhatsApp, invoiceReminderMessage } from "@/lib/whatsapp";
import { getUser } from "@/lib/auth";
import { LoadingState } from "@/components/ui/LoadingState";
import SendInvoiceModal from "../_components/SendInvoiceModal";
import PermissionGate from "@/components/ui/PermissionGate";
import { CopyButton } from "@/components/ui/CopyButton";

type RecordPaymentForm = {
  amount: number;
  mode: PaymentMode;
  referenceNumber: string;
  paymentDate: string;
  notes: string;
};

const statusStyles: Record<string, string> = {
  DRAFT: "bg-status-draft text-status-draft-foreground",
  PENDING: "bg-status-pending text-status-pending-foreground",
  PAID: "bg-status-paid text-status-paid-foreground",
  OVERDUE: "bg-status-overdue text-status-overdue-foreground",
  CANCELLED: "bg-status-cancelled text-status-cancelled-foreground",
};

const inputBase =
  "w-full px-3 py-2.5 bg-background border rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all placeholder:text-muted-foreground/60";
const inputNormal = `${inputBase} border-input`;
const inputError = `${inputBase} border-destructive bg-destructive/5`;
const labelBase =
  "block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5";

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

function PaymentModeIcon({ mode }: { mode: PaymentMode }) {
  const icons: Record<PaymentMode, string> = {
    CASH: "💵",
    UPI: "📱",
    BANK_TRANSFER: "🏦",
    CARD: "💳",
  };
  return <span>{icons[mode]}</span>;
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = getUser();
  const router = useRouter();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState("");
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | undefined>();

  const totalPaid = invoice?.payments.reduce((s, p) => s + p.amount, 0) ?? 0;
  const outstanding = (invoice?.total ?? 0) - totalPaid;

  const today = new Date().toISOString().split("T")[0];

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RecordPaymentForm>({
    defaultValues: {
      amount: 0,
      mode: "BANK_TRANSFER",
      referenceNumber: "",
      paymentDate: today,
      notes: "",
    },
  });

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const data = await fetchInvoice(id);
        setInvoice(data);
      } catch {
        router.push("/invoices");
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [id, router]);

  useEffect(() => {
    if (outstanding > 0) {
      reset((prev) => ({ ...prev, amount: outstanding }));
    }
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

      reset({
        amount: result.outstanding,
        mode: "BANK_TRANSFER",
        referenceNumber: "",
        paymentDate: today,
        notes: "",
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to record payment";
      setServerError(errorMessage);
    }
  };

  const handleCancel = async () => {
    if (!invoice || !confirm("Cancel this invoice?")) return;
    try {
      const updated = await updateInvoiceStatus(invoice.id, "CANCELLED");
      setInvoice((prev) => (prev ? { ...prev, status: updated.status } : prev));
    } catch {}
  };

  if (loading) return <LoadingState page="invoiceDetail" />;

  if (!invoice) return null;

  const canRecordPayment =
    invoice.status !== "PAID" && invoice.status !== "CANCELLED";

  return (
    <div className="min-h-full">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Link
            href="/invoices"
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          >
            ←
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-foreground">
                Invoice #{invoice.number}
              </h1>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[invoice.status]}`}
              >
                {invoice.status}
              </span>
              {invoice.isGstInvoice && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-accent/15 text-accent">
                  GST
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Created{" "}
              {new Date(invoice.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Cancel Button */}
          {invoice.status !== "CANCELLED" && invoice.status !== "PAID" && (
            <PermissionGate permission="invoice:edit">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-border text-sm font-medium rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all"
              >
                Cancel Invoice
              </button>
            </PermissionGate>
          )}

          {/* Email Button */}
          <PermissionGate permission="invoice:create">
            <button
              onClick={() => setSendModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 border border-border text-sm font-semibold rounded-lg text-muted-foreground hover:bg-muted transition-all"
            >
              <Send className="w-4 h-4" />
              Send Email
            </button>
          </PermissionGate>

          {/* Reminder Button */}
          {invoice.status !== "PAID" &&
            invoice.status !== "CANCELLED" &&
            invoice.client.phone && (
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
                        outstanding:
                          invoice.total -
                          invoice.payments.reduce((s, p) => s + p.amount, 0),
                        dueDate: invoice.dueDate,
                        status: invoice.status,
                      },
                      user?.business?.name ?? "",
                    ),
                  )
                }
                className="flex items-center gap-2 px-4 py-2 border border-[#25D366]/40 text-[#25D366] text-sm font-semibold rounded-lg hover:bg-[#25D366]/10 transition-all"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Send Reminder
              </button>
            )}

          {/* Download Button */}
          <InvoiceDownloadButton
            invoice={invoice}
            onQRReady={(url) => setQrDataUrl(url)}
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 min-w-0 space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  From
                </p>
                <div className="space-y-2">
                  <InfoRow label="Business" value={invoice.business?.name} />
                  <InfoRow label="GSTIN" value={invoice.business?.gstin} />
                  <InfoRow label="PAN" value={invoice.business?.pan} />
                  <InfoRow
                    label="Address"
                    value={[
                      invoice.business?.address,
                      invoice.business?.city,
                      invoice.business?.state,
                      invoice.business?.pincode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Billed To
                </p>
                <div className="space-y-2">
                  <InfoRow label="Client" value={invoice.client.name} />
                  <InfoRow
                    label="GSTIN"
                    value={invoice.client.gstin ?? undefined}
                  />
                  <InfoRow
                    label="PAN"
                    value={invoice.client.pan ?? undefined}
                  />
                  <InfoRow
                    label="Address"
                    value={[
                      invoice.client.address,
                      invoice.client.city,
                      invoice.client.state,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-4">
              <InfoRow
                label="Invoice Date"
                value={new Date(invoice.invoiceDate).toLocaleDateString(
                  "en-IN",
                  { day: "numeric", month: "short", year: "numeric" },
                )}
              />
              <InfoRow
                label="Due Date"
                value={new Date(invoice.dueDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              />
              <InfoRow label="Place of Supply" value={invoice.placeOfSupply} />
              <InfoRow
                label="Tax Type"
                value={invoice.taxType === "IGST" ? "IGST" : "CGST + SGST"}
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/40">
              <h2 className="text-sm font-semibold text-foreground">
                Line Items
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Description
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      HSN/SAC
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Qty
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Rate
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      GST
                    </th>
                    {invoice.taxType === "IGST" ? (
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        IGST
                      </th>
                    ) : (
                      <>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          CGST
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          SGST
                        </th>
                      </>
                    )}
                    <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoice.lineItems.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition">
                      <td className="px-6 py-4 text-foreground font-medium">
                        {item.description}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {item.hsnSac || "—"}
                      </td>
                      <td className="px-4 py-4 text-right text-muted-foreground">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-4 text-right text-muted-foreground">
                        ₹{item.rate.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-4 text-right text-muted-foreground">
                        {item.gstRate}%
                      </td>
                      {invoice.taxType === "IGST" ? (
                        <td className="px-4 py-4 text-right text-muted-foreground">
                          ₹
                          {item.igst.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      ) : (
                        <>
                          <td className="px-4 py-4 text-right text-muted-foreground">
                            ₹
                            {item.cgst.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-4 py-4 text-right text-muted-foreground">
                            ₹
                            {item.sgst.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                        </>
                      )}
                      <td className="px-6 py-4 text-right font-semibold text-foreground">
                        ₹
                        {item.total.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="px-6 py-4 border-t border-border bg-muted/20">
              <div className="flex flex-col items-end gap-1.5 text-sm">
                <div className="flex justify-between w-48 text-muted-foreground">
                  <span>Subtotal</span>
                  <span>
                    ₹
                    {invoice.subtotal.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between w-48 text-muted-foreground">
                  <span>Total Tax</span>
                  <span>
                    ₹
                    {invoice.totalTax.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between w-48 font-bold text-foreground text-base pt-2 border-t border-border">
                  <span>Total</span>
                  <span className="text-primary">
                    ₹
                    {invoice.total.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          {invoice.business?.bankDetails && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Bank Details
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <InfoRow
                  label="Bank"
                  value={invoice.business.bankDetails.bankName}
                />
                <InfoRow
                  label="Account Name"
                  value={invoice.business.bankDetails.accountName}
                />
                <InfoRow
                  label="Account Number"
                  value={invoice.business.bankDetails.accountNumber}
                />
                <InfoRow
                  label="IFSC"
                  value={invoice.business.bankDetails.ifsc}
                />
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Notes
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {invoice.notes}
              </p>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="w-full lg:w-80 shrink-0 lg:sticky lg:top-6 space-y-4">
          {/* Payment Summary */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-muted/40">
              <h3 className="text-sm font-semibold text-foreground">
                Payment Summary
              </h3>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Invoice Total</span>
                <span className="font-semibold text-foreground">
                  ₹
                  {invoice.total.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Paid</span>
                <span className="font-semibold text-status-paid-foreground">
                  ₹
                  {totalPaid.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-border">
                <span className="font-semibold text-foreground">
                  Outstanding
                </span>
                <span
                  className={`font-bold text-base ${
                    outstanding > 0
                      ? "text-status-overdue-foreground"
                      : "text-status-paid-foreground"
                  }`}
                >
                  ₹
                  {outstanding.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* UPI QR Preview */}
          {qrDataUrl && invoice.business.upiId && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border bg-muted/40">
                <h3 className="text-sm font-semibold text-foreground">
                  Pay via UPI
                </h3>
              </div>
              <div className="p-5 flex flex-col items-center gap-3">
                <img
                  src={qrDataUrl}
                  alt="UPI QR Code"
                  className="w-36 h-36 rounded-lg border border-border"
                />
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-xs font-mono font-semibold text-foreground">
                      {invoice.business.upiId}
                    </p>
                    <CopyButton text={invoice.business.upiId!} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Scan with any UPI app
                  </p>
                  <p className="text-sm font-bold text-primary mt-1">
                    ₹
                    {invoice.total.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  {["GPay", "PhonePe", "Paytm", "BHIM"].map((app) => (
                    <span
                      key={app}
                      className="px-2 py-1 bg-muted rounded text-xs text-muted-foreground font-medium"
                    >
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
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border bg-muted/40">
                  <h3 className="text-sm font-semibold text-foreground">
                    Record Payment
                  </h3>
                </div>
                <form
                  onSubmit={handleSubmit(onRecordPayment)}
                  noValidate
                  className="p-5 space-y-3"
                >
                  <div>
                    <label className={labelBase}>
                      Amount (₹) <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      {...register("amount", {
                        required: "Amount is required",
                        min: { value: 1, message: "Minimum ₹1" },
                        valueAsNumber: true,
                      })}
                      className={errors.amount ? inputError : inputNormal}
                    />
                    {errors.amount && (
                      <p className="text-xs text-destructive mt-1">
                        {errors.amount.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={labelBase}>
                      Payment Mode <span className="text-destructive">*</span>
                    </label>
                    <Controller
                      name="mode"
                      control={control}
                      rules={{ required: "Select payment mode" }}
                      render={({ field }) => (
                        <select {...field} className={inputNormal}>
                          {PAYMENT_MODES.map((m) => (
                            <option key={m.value} value={m.value}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                  </div>

                  <div>
                    <label className={labelBase}>Reference No.</label>
                    <input
                      type="text"
                      placeholder="UTR / transaction ID"
                      {...register("referenceNumber")}
                      className={inputNormal}
                    />
                  </div>

                  <div>
                    <label className={labelBase}>Payment Date</label>
                    <input
                      type="date"
                      {...register("paymentDate")}
                      className={inputNormal}
                    />
                  </div>

                  <div>
                    <label className={labelBase}>Notes</label>
                    <input
                      type="text"
                      placeholder="Optional note"
                      {...register("notes")}
                      className={inputNormal}
                    />
                  </div>

                  {serverError && (
                    <p className="text-xs text-destructive">{serverError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm shadow-primary/20"
                  >
                    {isSubmitting ? "Recording..." : "Record Payment"}
                  </button>
                </form>
              </div>
            )}
          </PermissionGate>

          {/* Payment History */}
          {invoice.payments.length > 0 && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border bg-muted/40">
                <h3 className="text-sm font-semibold text-foreground">
                  Payment History
                </h3>
              </div>
              <div className="divide-y divide-border">
                {invoice.payments.map((payment) => (
                  <div key={payment.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <PaymentModeIcon mode={payment.mode} />
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            ₹
                            {payment.amount.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {payment.mode.replace("_", " ")}
                            {payment.referenceNumber &&
                              ` · ${payment.referenceNumber}`}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(payment.paymentDate).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "short",
                          },
                        )}
                      </span>
                    </div>
                    {payment.notes && (
                      <p className="text-xs text-muted-foreground mt-1.5 ml-7">
                        {payment.notes}
                      </p>
                    )}
                  </div>
                ))}
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
