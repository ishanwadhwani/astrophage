"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ArrowLeft, Lock } from "lucide-react";

import { fetchBusiness, updateInvoicePrefix } from "@/lib/business";
import { useBusiness } from "@/hooks/useBusiness";
import { LoadingState } from "@/components/ui/LoadingState";
import PermissionGate from "@/components/ui/PermissionGate";
import { useToast } from "@/components/ui/Toast";

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

export default function InvoiceSection() {
  const { businessId } = useBusiness();
  const [loading, setLoading] = useState(true);

  const { success, error } = useToast();

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
        error("Failed to load invoice settings", "error");
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [businessId, reset]);

  const onSubmit = async (values: PrefixForm) => {
    try {
      await updateInvoicePrefix(businessId!, values.invoicePrefix);
      success("Invoice prefix saved", "success");
    } catch {
      error("Failed to save prefix", "error");
    }
  };

  if (loading) return <LoadingState page="settings" />;

  return (
    <PermissionGate
      permission="settings:edit"
      fallback={
        <div className="flex flex-col items-center justify-center text-center p-8 border border-border bg-card rounded-2xl max-w-sm mx-auto my-6 shadow-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground border border-border/40 flex items-center justify-center mb-4">
            <Lock className="w-5 h-5" strokeWidth={2.5} />
          </div>

          <h3 className="text-sm font-bold text-primary mb-1.5">
            View-Only Access
          </h3>
          <p className="text-xs text-muted-foreground max-w-65 mb-5 leading-normal">
            Your current role doesn&apos;t have permission to modify these
            parameters. Please contact your organization owner for full editing
            access.
          </p>

          <button
            onClick={() =>
              window.history.length > 1
                ? window.history.back()
                : (window.location.href = "/dashboard")
            }
            className="inline-flex items-center justify-center gap-2 h-10 px-4 w-full bg-background border border-border text-primary text-xs font-semibold rounded-xl hover:bg-muted shadow-sm transition-all active:scale-[0.98]"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
            Go back
          </button>
        </div>
      }
    >
      <SectionCard
        title="Invoice Numbering"
        description="Invoices will be numbered as PREFIX-0001, PREFIX-0002 and so on."
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-4"
        >
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
      </SectionCard>
    </PermissionGate>
  );
}
