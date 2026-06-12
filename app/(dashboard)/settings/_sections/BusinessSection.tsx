"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Building2, Check, ArrowLeft, Lock, Loader2 } from "lucide-react";

import { BusinessForm, UpdateBusinessPayload } from "@/types/business";
import { fetchBusiness, updateBusiness } from "@/lib/business";
import { useBusiness } from "@/hooks/useBusiness";
import { STATES } from "@/constants/invoice-options";
import { LoadingState } from "@/components/ui/LoadingState";
import PermissionGate from "@/components/ui/PermissionGate";
import { useToast } from "@/components/ui/Toast";

// ── Shared primitives ─────────────────────────────────────────────────────────

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
      {hint && !error && <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{hint}</p>}
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 shrink-0">
          {title}
        </span>
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
        type="submit"
        disabled={isSubmitting}
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

// ── Section ───────────────────────────────────────────────────────────────────

export default function BusinessSection() {
  const { businessId } = useBusiness();
  const { success, error } = useToast();
  const [loading,  setLoading]  = useState(true);
  const [mounted,  setMounted]  = useState(false);

  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<BusinessForm>({
      defaultValues: { name: "", email: "", phone: "", gstin: "", pan: "", address: "", city: "", state: "", pincode: "", upiId: "" },
    });

  useEffect(() => {
    if (!businessId) return;
    fetchBusiness(businessId)
      .then((d) => reset({ name: d.name ?? "", email: d.email ?? "", phone: d.phone ?? "", gstin: d.gstin ?? "", pan: d.pan ?? "", address: d.address ?? "", city: d.city ?? "", state: d.state ?? "", pincode: d.pincode ?? "", upiId: d.upiId ?? "" }))
      .catch(() => error("Failed to load business details", "error"))
      .finally(() => { setLoading(false); setTimeout(() => setMounted(true), 60); });
  }, [businessId, reset]);

  const onSubmit = async (values: BusinessForm) => {
    try {
      const payload: UpdateBusinessPayload = {
        name: values.name,
        email:   values.email   || undefined,
        phone:   values.phone   || undefined,
        gstin:   values.gstin   || undefined,
        pan:     values.pan     || undefined,
        address: values.address || undefined,
        city:    values.city    || undefined,
        state:   values.state   || undefined,
        pincode: values.pincode || undefined,
        upiId:   values.upiId   || undefined,
      };
      await updateBusiness(businessId!, payload);
      success("Business details saved", "success");
    } catch {
      error("Failed to save business details", "error");
    }
  };

  if (loading) return <LoadingState page="settings" />;

  return (
    <PermissionGate permission="settings:edit" fallback={<AccessDenied />}>
      <div className="bg-card border border-border rounded-2xl overflow-hidden">

        {/* Card header */}
        <div className="px-6 py-5 border-b border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-chart-1/10 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-chart-1" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Business Profile</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Your business identity shown on invoices — name, GSTIN, PAN and address.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-6 space-y-7">

          {/* Identity */}
          <div
            className={`space-y-4 transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
            style={{ transitionDelay: "60ms" }}
          >
            <Group title="Identity">
              <Field label="Business Name" required error={errors.name?.message} className="sm:col-span-2">
                <input type="text" placeholder="Nullpalette Private Limited" {...register("name", { required: "Business name is required" })} className={errors.name ? inpErr : inp} />
              </Field>
              <Field label="GSTIN">
                <input type="text" placeholder="09AAHCN9733B1ZC" {...register("gstin")} className={inp} />
              </Field>
              <Field label="PAN">
                <input type="text" placeholder="AAHCN9733B" {...register("pan")} className={inp} />
              </Field>
            </Group>
          </div>

          {/* Contact */}
          <div
            className={`space-y-4 transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
            style={{ transitionDelay: "120ms" }}
          >
            <Group title="Contact">
              <Field
                label="Business Email"
                hint="Shown on invoices and used as the reply-to when emailing clients. Not your login email."
              >
                <input type="email" placeholder="billing@company.com" {...register("email")} className={inp} />
              </Field>
              <Field label="Phone">
                <input type="tel" placeholder="+91 98765 43210" {...register("phone")} className={inp} />
              </Field>
              <Field label="UPI ID" hint="Added to invoices as a QR code — clients scan to pay instantly." className="sm:col-span-2">
                <input type="text" placeholder="yourname@upi or 9876543210@paytm" {...register("upiId")} className={inp} />
              </Field>
            </Group>
          </div>

          {/* Address */}
          <div
            className={`space-y-4 transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
            style={{ transitionDelay: "180ms" }}
          >
            <Group title="Address">
              <Field label="Street Address" className="sm:col-span-2">
                <input type="text" placeholder="Building, Street" {...register("address")} className={inp} />
              </Field>
              <Field label="City">
                <input type="text" placeholder="Lucknow" {...register("city")} className={inp} />
              </Field>
              <Field label="Pincode">
                <input type="text" placeholder="226001" {...register("pincode")} className={inp} />
              </Field>
              <Field label="State" required error={errors.state?.message} className="sm:col-span-2">
                <Controller
                  name="state" control={control}
                  rules={{ required: "State is required for GST calculation" }}
                  render={({ field }) => (
                    <select {...field} className={errors.state ? inpErr : inp}>
                      <option value="">Select state</option>
                      {STATES.map((s) => <option key={s.key} value={s.value}>{s.label}</option>)}
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
