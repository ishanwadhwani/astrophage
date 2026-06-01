"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";

import {
  Business,
  UpdateBusinessPayload,
  BankDetailsPayload,
  BusinessForm,
  BankForm,
} from "@/types/business";
import {
  fetchBusiness,
  updateBusiness,
  saveBankDetails,
  updateInvoicePrefix,
} from "@/lib/business";
import { useBusiness } from "@/hooks/useBusiness";
import { STATES } from "@/constants/invoice-options";
import { LoadingState } from "@/components/ui/LoadingState";

const ACCOUNT_TYPES = ["Current", "Savings", "OD", "CC"];
type PrefixForm = { invoicePrefix: string };

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
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
        type === "success"
          ? "bg-status-paid text-status-paid-foreground"
          : "bg-destructive/10 text-destructive border border-destructive/20"
      }`}
    >
      <span>{type === "success" ? "✓" : "⚠"}</span>
      {message}
    </div>
  );
}

export default function SettingsPage() {
  const { businessId } = useBusiness();

  const [business, setBusiness] = useState<Business | null>(null);
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
    register: regBusiness,
    control: controlBusiness,
    handleSubmit: handleBusiness,
    reset: resetBusiness,
    formState: { errors: bizErrors, isSubmitting: bizSubmitting },
  } = useForm<BusinessForm>({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      gstin: "",
      pan: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
    },
  });

  const {
    register: regBank,
    control: controlBank,
    handleSubmit: handleBank,
    reset: resetBank,
    formState: { errors: bankErrors, isSubmitting: bankSubmitting },
  } = useForm<BankForm>({
    defaultValues: {
      accountName: "",
      accountNumber: "",
      ifsc: "",
      accountType: "Current",
      bankName: "",
    },
  });

  const {
    register: regPrefix,
    handleSubmit: handlePrefix,
    reset: resetPrefix,
    formState: { isSubmitting: prefixSubmitting },
  } = useForm<PrefixForm>({
    defaultValues: { invoicePrefix: "INV" },
  });

  useEffect(() => {
    if (!businessId) return;

    const fetchData = async () => {
      try {
        const data = await fetchBusiness(businessId);
        setBusiness(data);

        resetBusiness({
          name: data.name ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          gstin: data.gstin ?? "",
          pan: data.pan ?? "",
          address: data.address ?? "",
          city: data.city ?? "",
          state: data.state ?? "",
          pincode: data.pincode ?? "",
          upiId: data.upiId ?? "",
        });

        resetPrefix({
          invoicePrefix: data.invoicePrefix ?? "INV",
        });

        if (data.bankDetails) {
          resetBank({
            accountName: data.bankDetails.accountName,
            accountNumber: data.bankDetails.accountNumber,
            ifsc: data.bankDetails.ifsc,
            accountType: data.bankDetails.accountType,
            bankName: data.bankDetails.bankName,
          });
        }
      } catch {
        showToast("Failed to load business details", "error");
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [businessId, resetBusiness, resetBank, resetPrefix]);

  const onSaveBusiness = async (values: BusinessForm) => {
    try {
      const payload: UpdateBusinessPayload = {
        name: values.name,
        email: values.email || undefined,
        phone: values.phone || undefined,
        gstin: values.gstin || undefined,
        pan: values.pan || undefined,
        address: values.address || undefined,
        city: values.city || undefined,
        state: values.state || undefined,
        pincode: values.pincode || undefined,
        upiId: values.upiId || undefined,
      };
      const updated = await updateBusiness(businessId, payload);
      setBusiness((prev) => (prev ? { ...prev, ...updated } : prev));
      showToast("Business details saved", "success");
    } catch {
      showToast("Failed to save business details", "error");
    }
  };

  const onSaveBank = async (values: BankForm) => {
    try {
      const payload: BankDetailsPayload = {
        accountName: values.accountName,
        accountNumber: values.accountNumber,
        ifsc: values.ifsc,
        accountType: values.accountType,
        bankName: values.bankName,
      };
      const updated = await saveBankDetails(businessId, payload);
      setBusiness((prev) => (prev ? { ...prev, bankDetails: updated } : prev));
      showToast("Bank details saved", "success");
    } catch {
      showToast("Failed to save bank details", "error");
    }
  };

  const onSavePrefix = async (values: PrefixForm) => {
    try {
      await updateInvoicePrefix(businessId, values.invoicePrefix);
      showToast("Invoice prefix saved", "success");
    } catch {
      showToast("Failed to save prefix", "error");
    }
  };

  if (loading) return <LoadingState page="settings" fullScreen />;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your business profile and bank details. This information
          appears on every invoice you generate.
        </p>
      </div>

      {/* Business Profile */}
      <SectionCard
        title="Business Profile"
        description="Your business identity shown on invoices — name, GSTIN, PAN, and address."
      >
        <form
          onSubmit={handleBusiness(onSaveBusiness)}
          noValidate
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelBase}>
                Business Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                placeholder="Nullpalette Private Limited"
                {...regBusiness("name", {
                  required: "Business name is required",
                })}
                className={bizErrors.name ? inputError : inputNormal}
              />
              <FieldError message={bizErrors.name?.message} />
            </div>

            <div>
              <label className={labelBase}>GSTIN</label>
              <input
                type="text"
                placeholder="09AAHCN9733B1ZC"
                {...regBusiness("gstin")}
                className={inputNormal}
              />
            </div>

            <div>
              <label className={labelBase}>PAN</label>
              <input
                type="text"
                placeholder="AAHCN9733B"
                {...regBusiness("pan")}
                className={inputNormal}
              />
            </div>

            <div>
              <label className={labelBase}>Email</label>
              <input
                type="email"
                placeholder="billing@company.com"
                {...regBusiness("email")}
                className={inputNormal}
              />
            </div>

            <div>
              <label className={labelBase}>Phone</label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                {...regBusiness("phone")}
                className={inputNormal}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelBase}>UPI ID</label>
              <input
                type="text"
                placeholder="yourname@upi or 9876543210@paytm"
                {...regBusiness("upiId")}
                className={inputNormal}
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Added to invoices as a QR code — clients scan to pay instantly
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className={labelBase}>Street Address</label>
              <input
                type="text"
                placeholder="Building, Street"
                {...regBusiness("address")}
                className={inputNormal}
              />
            </div>

            <div>
              <label className={labelBase}>City</label>
              <input
                type="text"
                placeholder="Lucknow"
                {...regBusiness("city")}
                className={inputNormal}
              />
            </div>

            <div>
              <label className={labelBase}>Pincode</label>
              <input
                type="text"
                placeholder="226001"
                {...regBusiness("pincode")}
                className={inputNormal}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelBase}>
                State <span className="text-destructive">*</span>
              </label>
              <Controller
                name="state"
                control={controlBusiness}
                rules={{ required: "State is required for GST calculation" }}
                render={({ field }) => (
                  <select
                    {...field}
                    className={bizErrors.state ? inputError : inputNormal}
                  >
                    <option value="">Select state</option>
                    {STATES.map((s) => (
                      <option key={s.key} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                )}
              />
              <FieldError message={bizErrors.state?.message} />
            </div>
          </div>

          <SaveButton isSubmitting={bizSubmitting} />
        </form>
      </SectionCard>

      {/* Bank Details */}
      <SectionCard
        title="Bank Details"
        description="Shown on invoices so clients know where to transfer payments."
      >
        <form
          onSubmit={handleBank(onSaveBank)}
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
                {...regBank("accountName", {
                  required: "Account name is required",
                })}
                className={bankErrors.accountName ? inputError : inputNormal}
              />
              <FieldError message={bankErrors.accountName?.message} />
            </div>

            <div>
              <label className={labelBase}>
                Account Number <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                placeholder="126505001758"
                {...regBank("accountNumber", {
                  required: "Account number is required",
                })}
                className={bankErrors.accountNumber ? inputError : inputNormal}
              />
              <FieldError message={bankErrors.accountNumber?.message} />
            </div>

            <div>
              <label className={labelBase}>
                IFSC Code <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                placeholder="ICIC0001265"
                {...regBank("ifsc", { required: "IFSC is required" })}
                className={bankErrors.ifsc ? inputError : inputNormal}
              />
              <FieldError message={bankErrors.ifsc?.message} />
            </div>

            <div>
              <label className={labelBase}>
                Bank Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                placeholder="ICICI Bank"
                {...regBank("bankName", { required: "Bank name is required" })}
                className={bankErrors.bankName ? inputError : inputNormal}
              />
              <FieldError message={bankErrors.bankName?.message} />
            </div>

            <div>
              <label className={labelBase}>Account Type</label>
              <Controller
                name="accountType"
                control={controlBank}
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

          <SaveButton isSubmitting={bankSubmitting} />
        </form>
      </SectionCard>

      <SectionCard
        title="Invoice Numbering"
        description="Invoices will be numbered as PREFIX-0001, PREFIX-0002 and so on."
      >
        <form
          onSubmit={handlePrefix(onSavePrefix)}
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
              {...regPrefix("invoicePrefix", {
                required: "Prefix is required",
                maxLength: { value: 10, message: "Max 10 characters" },
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
          <SaveButton isSubmitting={prefixSubmitting} />
        </form>
      </SectionCard>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
