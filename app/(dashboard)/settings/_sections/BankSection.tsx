"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { ArrowLeft, Lock } from "lucide-react";

import { BankForm, BankDetailsPayload } from "@/types/business";
import { fetchBusiness, saveBankDetails } from "@/lib/business";
import { useBusiness } from "@/hooks/useBusiness";
import { LoadingState } from "@/components/ui/LoadingState";
import PermissionGate from "@/components/ui/PermissionGate";
import { useToast } from "@/components/ui/Toast";

const ACCOUNT_TYPES = ["Current", "Savings", "OD", "CC"];

const inputBase =
  "w-full px-3 py-2.5 bg-background border rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all placeholder:text-muted-foreground/60";
const inputNormal = `${inputBase} border-input`;
const inputError = `${inputBase} border-destructive bg-destructive/5`;
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

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1.5">{message}</p>;
}

export default function BankSection() {
  const { businessId } = useBusiness();
  const [loading, setLoading] = useState(true);

  const { success, error } = useToast();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BankForm>({
    defaultValues: {
      accountName: "",
      accountNumber: "",
      ifsc: "",
      accountType: "Current",
      bankName: "",
    },
  });

  useEffect(() => {
    if (!businessId) return;
    const fetchData = async () => {
      try {
        const data = await fetchBusiness(businessId);
        if (data.bankDetails) {
          reset({
            accountName: data.bankDetails.accountName,
            accountNumber: data.bankDetails.accountNumber,
            ifsc: data.bankDetails.ifsc,
            accountType: data.bankDetails.accountType,
            bankName: data.bankDetails.bankName,
          });
        }
      } catch {
        error("Failed to load bank details", "error");
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [businessId, reset]);

  const onSubmit = async (values: BankForm) => {
    try {
      const payload: BankDetailsPayload = {
        accountName: values.accountName,
        accountNumber: values.accountNumber,
        ifsc: values.ifsc,
        accountType: values.accountType,
        bankName: values.bankName,
      };
      await saveBankDetails(businessId!, payload);
      success("Bank details saved", "success");
    } catch {
      error("Failed to save bank details", "error");
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
        title="Bank Details"
        description="Shown on invoices so clients know where to transfer payments."
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelBase}>
                Account Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                placeholder="Nullpalette Private Limited"
                {...register("accountName", {
                  required: "Account name is required",
                })}
                className={errors.accountName ? inputError : inputNormal}
              />
              <FieldError message={errors.accountName?.message} />
            </div>
            <div>
              <label className={labelBase}>
                Account Number <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                placeholder="126505001758"
                {...register("accountNumber", {
                  required: "Account number is required",
                })}
                className={errors.accountNumber ? inputError : inputNormal}
              />
              <FieldError message={errors.accountNumber?.message} />
            </div>
            <div>
              <label className={labelBase}>
                IFSC Code <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                placeholder="ICIC0001265"
                {...register("ifsc", { required: "IFSC is required" })}
                className={errors.ifsc ? inputError : inputNormal}
              />
              <FieldError message={errors.ifsc?.message} />
            </div>
            <div>
              <label className={labelBase}>
                Bank Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                placeholder="ICICI Bank"
                {...register("bankName", { required: "Bank name is required" })}
                className={errors.bankName ? inputError : inputNormal}
              />
              <FieldError message={errors.bankName?.message} />
            </div>
            <div>
              <label className={labelBase}>Account Type</label>
              <Controller
                name="accountType"
                control={control}
                render={({ field }) => (
                  <select {...field} className={inputNormal}>
                    {ACCOUNT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>
          </div>
          <SaveButton isSubmitting={isSubmitting} />
        </form>
      </SectionCard>
    </PermissionGate>
  );
}
