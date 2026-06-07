"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { BusinessForm, UpdateBusinessPayload } from "@/types/business";
import { fetchBusiness, updateBusiness } from "@/lib/business";
import { useBusiness } from "@/hooks/useBusiness";
import { STATES } from "@/constants/invoice-options";
import { LoadingState } from "@/components/ui/LoadingState";

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

export default function BusinessSection() {
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
      upiId: "",
    },
  });

  useEffect(() => {
    if (!businessId) return;
    const fetchData = async () => {
      try {
        const data = await fetchBusiness(businessId);
        reset({
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
      } catch {
        showToast("Failed to load business details", "error");
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [businessId, reset]);

  const onSubmit = async (values: BusinessForm) => {
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
      await updateBusiness(businessId!, payload);
      showToast("Business details saved", "success");
    } catch {
      showToast("Failed to save business details", "error");
    }
  };

  if (loading) return <LoadingState page="settings" />;

  return (
    <SectionCard
      title="Business Profile"
      description="Your business identity shown on invoices — name, GSTIN, PAN, and address."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelBase}>
              Business Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              placeholder="Nullpalette Private Limited"
              {...register("name", { required: "Business name is required" })}
              className={errors.name ? inputError : inputNormal}
            />
            <FieldError message={errors.name?.message} />
          </div>
          <div>
            <label className={labelBase}>GSTIN</label>
            <input
              type="text"
              placeholder="09AAHCN9733B1ZC"
              {...register("gstin")}
              className={inputNormal}
            />
          </div>
          <div>
            <label className={labelBase}>PAN</label>
            <input
              type="text"
              placeholder="AAHCN9733B"
              {...register("pan")}
              className={inputNormal}
            />
          </div>
          <div>
            <label className={labelBase}>Email</label>
            <input
              type="email"
              placeholder="billing@company.com"
              {...register("email")}
              className={inputNormal}
            />
          </div>
          <div>
            <label className={labelBase}>Business Contact Email</label>
            <input
              type="email"
              placeholder="invoices@company.com"
              {...register("email")}
              className={inputNormal}
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              This appears on invoices and is used as the reply-to address when
              emailing clients. This is <strong>not</strong> your login email.
            </p>
          </div>
          <div>
            <label className={labelBase}>Phone</label>
            <input
              type="tel"
              placeholder="+91 98765 43210"
              {...register("phone")}
              className={inputNormal}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelBase}>UPI ID</label>
            <input
              type="text"
              placeholder="yourname@upi or 9876543210@paytm"
              {...register("upiId")}
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
              {...register("address")}
              className={inputNormal}
            />
          </div>
          <div>
            <label className={labelBase}>City</label>
            <input
              type="text"
              placeholder="Lucknow"
              {...register("city")}
              className={inputNormal}
            />
          </div>
          <div>
            <label className={labelBase}>Pincode</label>
            <input
              type="text"
              placeholder="226001"
              {...register("pincode")}
              className={inputNormal}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelBase}>
              State <span className="text-destructive">*</span>
            </label>
            <Controller
              name="state"
              control={control}
              rules={{ required: "State is required for GST calculation" }}
              render={({ field }) => (
                <select
                  {...field}
                  className={errors.state ? inputError : inputNormal}
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
            <FieldError message={errors.state?.message} />
          </div>
        </div>
        <SaveButton isSubmitting={isSubmitting} />
      </form>
      {toast && <Toast message={toast.message} type={toast.type} />}
    </SectionCard>
  );
}
