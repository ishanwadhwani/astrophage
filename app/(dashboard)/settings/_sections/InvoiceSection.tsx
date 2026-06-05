"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { fetchBusiness, updateInvoicePrefix } from "@/lib/business";
import { useBusiness } from "@/hooks/useBusiness";
import { LoadingState } from "@/components/ui/LoadingState";

type PrefixForm = { invoicePrefix: string };

const inputBase =
  "w-full px-3 py-2.5 bg-background border rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all placeholder:text-muted-foreground/60";
const inputNormal = `${inputBase} border-input`;
const labelBase =
  "block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5";

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-6 py-5 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function SaveButton({ isSubmitting }: { isSubmitting: boolean }) {
  return (
    <div className="flex justify-end pt-4 border-t border-border">
      <button
        type="submit"
        disabled={isSubmitting}
        className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm shadow-primary/20"
      >
        {isSubmitting ? "Saving..." : "Save changes"}
      </button>
    </div>
  );
}

function Toast({
  message,
  type,
}: {
  message: string;
  type: "success" | "error";
}) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${type === "success" ? "bg-status-paid text-status-paid-foreground" : "bg-destructive/10 text-destructive border border-destructive/20"}`}
    >
      <span>{type === "success" ? "✓" : "⚠"}</span>
      {message}
    </div>
  );
}

export default function InvoiceSection() {
  const { businessId } = useBusiness();
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<PrefixForm>({
    defaultValues: { invoicePrefix: "INV" },
  });

  useEffect(() => {
    if (!businessId) return;
    const fetchData = async () => {
      try {
        const data = await fetchBusiness(businessId);
        reset({ invoicePrefix: data.invoicePrefix ?? "INV" });
      } catch {
        showToast("Failed to load invoice settings", "error");
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [businessId, reset]);

  const onSubmit = async (values: PrefixForm) => {
    try {
      await updateInvoicePrefix(businessId!, values.invoicePrefix);
      showToast("Invoice prefix saved", "success");
    } catch {
      showToast("Failed to save prefix", "error");
    }
  };

  if (loading) return <LoadingState page="settings" />;

  return (
    <SectionCard
      title="Invoice Numbering"
      description="Invoices will be numbered as PREFIX-0001, PREFIX-0002 and so on."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="max-w-xs">
          <label className={labelBase}>
            Invoice Prefix <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            placeholder="INV"
            maxLength={10}
            {...register("invoicePrefix", {
              required: "Prefix is required",
              maxLength: 10,
            })}
            className={inputNormal}
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Your next invoice will be numbered{" "}
            <span className="font-mono font-semibold text-foreground">
              PREFIX-0001
            </span>
          </p>
        </div>
        <SaveButton isSubmitting={isSubmitting} />
      </form>
      {toast && <Toast message={toast.message} type={toast.type} />}
    </SectionCard>
  );
}
