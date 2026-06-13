"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { FilePen, Check, ArrowLeft, Lock, Loader2, Hash } from "lucide-react";

import { fetchBusiness, updateInvoicePrefix } from "@/lib/business";
import { useBusiness } from "@/hooks/useBusiness";
import { LoadingState } from "@/components/ui/LoadingState";
import PermissionGate from "@/components/ui/PermissionGate";
import { useToast } from "@/components/ui/Toast";

type PrefixForm = { invoicePrefix: string };

const inp = "w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-sm text-foreground outline-none transition-all duration-150 placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/10";
const inpErr = "w-full px-3.5 py-2.5 bg-destructive/5 border border-destructive rounded-xl text-sm text-foreground outline-none transition-all duration-150 focus:ring-2 focus:ring-destructive/15";
const lbl = "block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5";

const AccessDenied = () => (
  <div className="flex flex-col items-center justify-center text-center p-10 border border-border bg-card rounded-2xl shadow-sm">
    <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-4">
      <Lock className="w-5 h-5 text-muted-foreground" />
    </div>
    <h3 className="text-sm font-bold text-foreground mb-1.5">View-Only Access</h3>
    <p className="text-xs text-muted-foreground max-w-64 mb-5 leading-relaxed">
      Your role doesn&apos;t allow modifying these settings. Contact your organisation owner for access.
    </p>
    <button
      onClick={() => window.history.length > 1 ? window.history.back() : (window.location.href = "/dashboard")}
      className="flex items-center justify-center gap-2 w-full h-10 px-4 bg-background border border-border text-sm font-semibold rounded-xl hover:bg-muted transition-all active:scale-[0.98]"
    >
      <ArrowLeft className="w-3.5 h-3.5" />Go back
    </button>
  </div>
);

export default function InvoiceSection() {
  const { businessId } = useBusiness();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } =
    useForm<PrefixForm>({ defaultValues: { invoicePrefix: "INV" } });

  const prefix = useWatch({ control, name: "invoicePrefix" }) || "INV";

  useEffect(() => {
    if (!businessId) return;
    fetchBusiness(businessId)
      .then((d) => reset({ invoicePrefix: d.invoicePrefix ?? "INV" }))
      .catch(() => error("Failed to load invoice settings", "error"))
      .finally(() => { setLoading(false); setTimeout(() => setMounted(true), 60); });
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
    <PermissionGate permission="settings:edit" fallback={<AccessDenied />}>
      <div className="bg-card border border-border rounded-2xl overflow-hidden">

        <div className="px-6 py-5 border-b border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-chart-3/10 flex items-center justify-center shrink-0">
            <FilePen className="w-4 h-4 text-chart-3" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Invoice Settings</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Configure how invoices are numbered across your business.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-6 space-y-6">

          <div
            className={`transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
            style={{ transitionDelay: "60ms" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 shrink-0">Numbering</span>
              <div className="flex-1 h-px bg-border/60" />
            </div>

            <div className="max-w-xs space-y-3">
              <div>
                <label className={lbl}>
                  Invoice Prefix <span className="text-destructive">*</span>
                </label>
                <input
                  type="text" placeholder="INV" maxLength={10}
                  {...register("invoicePrefix", { required: "Prefix is required", maxLength: 10 })}
                  className={`${errors.invoicePrefix ? inpErr : inp} uppercase`}
                />
                {errors.invoicePrefix && (
                  <p className="text-xs text-destructive mt-1.5">{errors.invoicePrefix.message}</p>
                )}
              </div>

              {/* Live preview */}
              <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border border-border/60 rounded-xl">
                <Hash className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground">Next invoice will continue with same numbering sequence. Changing sequence does not change number sequence.</p>
                {/* <span className="font-mono font-bold text-foreground text-xs ml-auto">
                  {prefix.toUpperCase()}-0001
                </span> */}
              </div>
            </div>
          </div>

          {/* What this affects */}
          <div
            className={`transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
            style={{ transitionDelay: "120ms" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 shrink-0">Note</span>
              <div className="flex-1 h-px bg-border/60" />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Changing the prefix only affects <strong className="text-foreground">new</strong> invoices. Existing invoice numbers are not changed.
              Invoices are numbered sequentially: <span className="font-mono font-semibold text-foreground">{prefix.toUpperCase()}-0001</span>,{" "}
              <span className="font-mono font-semibold text-foreground">{prefix.toUpperCase()}-0002</span>, and so on.
            </p>
          </div>

          <div className="flex justify-end pt-5 mt-1 border-t border-border">
            <button
              type="submit" disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-[0.98] shadow-sm shadow-primary/20"
            >
              {isSubmitting
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving…</>
                : <><Check className="w-3.5 h-3.5" />Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </PermissionGate>
  );
}
