"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Landmark, Check, ArrowLeft, Lock, Loader2 } from "lucide-react";

import { BankForm, BankDetailsPayload } from "@/types/business";
import { fetchBusiness, saveBankDetails } from "@/lib/business";
import { useBusiness } from "@/hooks/useBusiness";
import { LoadingState } from "@/components/ui/LoadingState";
import PermissionGate from "@/components/ui/PermissionGate";
import { useToast } from "@/components/ui/Toast";

const ACCOUNT_TYPES = ["Current", "Savings", "OD", "CC"];

const inp = "w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-sm text-foreground outline-none transition-all duration-150 placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/10";
const inpErr = "w-full px-3.5 py-2.5 bg-destructive/5 border border-destructive rounded-xl text-sm text-foreground outline-none transition-all duration-150 focus:ring-2 focus:ring-destructive/15";
const lbl = "block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5";

function Field({ label, required, hint, error, className = "", children }: {
  label: string; required?: boolean; hint?: string;
  error?: string; className?: string; children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className={lbl}>
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
      {error  && <p className="text-xs text-destructive mt-1.5">{error}</p>}
      {hint && !error && <p className="text-xs text-muted-foreground mt-1.5">{hint}</p>}
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 shrink-0">{title}</span>
        <div className="flex-1 h-px bg-border/60" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function SaveBtn({ isSubmitting }: { isSubmitting: boolean }) {
  return (
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
  );
}

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

export default function BankSection() {
  const { businessId } = useBusiness();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<BankForm>({
      defaultValues: { accountName: "", accountNumber: "", ifsc: "", accountType: "Current", bankName: "" },
    });

  useEffect(() => {
    if (!businessId) return;
    fetchBusiness(businessId)
      .then((d) => {
        if (d.bankDetails) {
          reset({
            accountName:   d.bankDetails.accountName,
            accountNumber: d.bankDetails.accountNumber,
            ifsc:          d.bankDetails.ifsc,
            accountType:   d.bankDetails.accountType,
            bankName:      d.bankDetails.bankName,
          });
        }
      })
      .catch(() => error("Failed to load bank details", "error"))
      .finally(() => { setLoading(false); setTimeout(() => setMounted(true), 60); });
  }, [businessId, reset]);

  const onSubmit = async (values: BankForm) => {
    try {
      const payload: BankDetailsPayload = {
        accountName:   values.accountName,
        accountNumber: values.accountNumber,
        ifsc:          values.ifsc,
        accountType:   values.accountType,
        bankName:      values.bankName,
      };
      await saveBankDetails(businessId!, payload);
      success("Bank details saved", "success");
    } catch {
      error("Failed to save bank details", "error");
    }
  };

  if (loading) return <LoadingState page="settings" />;

  return (
    <PermissionGate permission="settings:edit" fallback={<AccessDenied />}>
      <div className="bg-card border border-border rounded-2xl overflow-hidden">

        <div className="px-6 py-5 border-b border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-chart-2/10 flex items-center justify-center shrink-0">
            <Landmark className="w-4 h-4 text-chart-2" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Bank Details</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Shown on invoices so clients know where to transfer payments.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-6 space-y-7">

          <div
            className={`transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
            style={{ transitionDelay: "60ms" }}
          >
            <Group title="Account">
              <Field label="Account Name" required error={errors.accountName?.message} className="sm:col-span-2">
                <input type="text" placeholder="Nullpalette Private Limited"
                  {...register("accountName", { required: "Account name is required" })}
                  className={errors.accountName ? inpErr : inp} />
              </Field>
              <Field label="Account Number" required error={errors.accountNumber?.message}>
                <input type="text" placeholder="126505001758"
                  {...register("accountNumber", { required: "Account number is required" })}
                  className={errors.accountNumber ? inpErr : inp} />
              </Field>
              <Field label="IFSC Code" required error={errors.ifsc?.message}>
                <input type="text" placeholder="ICIC0001265"
                  {...register("ifsc", { required: "IFSC is required" })}
                  className={errors.ifsc ? inpErr : inp} />
              </Field>
            </Group>
          </div>

          <div
            className={`transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
            style={{ transitionDelay: "120ms" }}
          >
            <Group title="Bank Info">
              <Field label="Bank Name" required error={errors.bankName?.message}>
                <input type="text" placeholder="ICICI Bank"
                  {...register("bankName", { required: "Bank name is required" })}
                  className={errors.bankName ? inpErr : inp} />
              </Field>
              <Field label="Account Type">
                <Controller
                  name="accountType" control={control}
                  render={({ field }) => (
                    <select {...field} className={inp}>
                      {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  )}
                />
              </Field>
            </Group>
          </div>

          <SaveBtn isSubmitting={isSubmitting} />
        </form>
      </div>
    </PermissionGate>
  );
}
