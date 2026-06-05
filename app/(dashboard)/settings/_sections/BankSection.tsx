"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { BankForm, BankDetailsPayload } from "@/types/business";
import { fetchBusiness, saveBankDetails } from "@/lib/business";
import { useBusiness } from "@/hooks/useBusiness";
import { LoadingState } from "@/components/ui/LoadingState";

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

export default function BankSection() {
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
        showToast("Failed to load bank details", "error");
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
      showToast("Bank details saved", "success");
    } catch {
      showToast("Failed to save bank details", "error");
    }
  };

  if (loading) return <LoadingState page="settings" />;

  return (
    <SectionCard
      title="Bank Details"
      description="Shown on invoices so clients know where to transfer payments."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
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
      {toast && <Toast message={toast.message} type={toast.type} />}
    </SectionCard>
  );
}
