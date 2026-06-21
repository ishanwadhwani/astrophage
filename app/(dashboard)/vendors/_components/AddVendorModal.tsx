"use client";

import { useForm, Controller } from "react-hook-form";
import { CreateVendorPayload, Vendor } from "@/types/vendor";
import { createVendor } from "@/lib/vendors";
import Modal from "@/components/shared/Modal";
import { STATES } from "@/constants/invoice-options";
import {
  emailRules, phoneRules, gstinRules, panRules, pincodeRules,
  toUpperNoSpace, formatPhone,
} from "@/lib/validators";

const inputBase =
  "w-full px-3 py-2.5 bg-background border rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all placeholder:text-muted-foreground/60";
const inputNormal = `${inputBase} border-input`;
const inputError  = `${inputBase} border-destructive bg-destructive/5`;
const labelBase   =
  "block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5";

type VendorForm = {
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  gstin: string;
  pan: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  notes: string;
};

interface Props {
  isOpen: boolean;
  businessId: string;
  onClose: () => void;
  onCreated: (vendor: Vendor) => void;
}

export default function AddVendorModal({ isOpen, businessId, onClose, onCreated }: Props) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VendorForm>({
    defaultValues: {
      name: "", email: "", phone: "", countryCode: "+91",
      gstin: "", pan: "", address: "", city: "", state: "", pincode: "", notes: "",
    },
  });

  const onSubmit = async (values: VendorForm) => {
    try {
      const payload: CreateVendorPayload = {
        ...values,
        businessId,
        email:   values.email   || undefined,
        phone:   values.phone   || undefined,
        gstin:   values.gstin   || undefined,
        pan:     values.pan     || undefined,
        address: values.address || undefined,
        city:    values.city    || undefined,
        state:   values.state   || undefined,
        pincode: values.pincode || undefined,
        notes:   values.notes   || undefined,
      };
      const vendor = await createVendor(payload);
      onCreated({ ...vendor, _count: { bills: 0 } });
      reset();
      onClose();
    } catch {}
  };

  const handleClose = () => { onClose(); reset(); };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Vendor">
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-4 max-h-[70vh] overflow-y-auto overflow-x-hidden pr-2"
      >
        {/* Name */}
        <div>
          <label className={labelBase}>
            Name <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            placeholder="Vendor or company name"
            maxLength={100}
            {...register("name", { required: "Name is required" })}
            className={errors.name ? inputError : inputNormal}
          />
          {errors.name && <p className="text-xs text-destructive mt-1.5">{errors.name.message}</p>}
        </div>

        {/* Email + Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelBase}>Email</label>
            <input
              type="email"
              placeholder="vendor@example.com"
              {...register("email", emailRules)}
              className={errors.email ? inputError : inputNormal}
            />
            {errors.email && <p className="text-xs text-destructive mt-1.5">{errors.email.message}</p>}
          </div>
          <div>
            <label className={labelBase}>Phone</label>
            <div className="flex gap-2">
              <select
                {...register("countryCode")}
                className={`shrink-0 text-center px-1`}
              >
                <option value="+91">+91</option>
              </select>
              <Controller
                name="phone"
                control={control}
                rules={phoneRules}
                render={({ field }) => (
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="9876543210"
                    maxLength={10}
                    value={field.value}
                    onChange={(e) => field.onChange(formatPhone(e.target.value))}
                    className={`${errors.phone ? inputError : inputNormal} flex-1 min-w-0`}
                  />
                )}
              />
            </div>
            {errors.phone && <p className="text-xs text-destructive mt-1.5">{errors.phone.message}</p>}
          </div>
        </div>

        {/* GSTIN + PAN */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelBase}>GSTIN</label>
            <Controller
              name="gstin"
              control={control}
              rules={gstinRules}
              render={({ field }) => (
                <input
                  type="text"
                  placeholder="09AAHCN9733B1ZC"
                  maxLength={15}
                  value={field.value}
                  onChange={(e) => field.onChange(toUpperNoSpace(e.target.value))}
                  className={`uppercase ${errors.gstin ? inputError : inputNormal}`}
                />
              )}
            />
            {errors.gstin && <p className="text-xs text-destructive mt-1.5">{errors.gstin.message}</p>}
          </div>
          <div>
            <label className={labelBase}>PAN</label>
            <Controller
              name="pan"
              control={control}
              rules={panRules}
              render={({ field }) => (
                <input
                  type="text"
                  placeholder="AAHCN9733B"
                  maxLength={10}
                  value={field.value}
                  onChange={(e) => field.onChange(toUpperNoSpace(e.target.value))}
                  className={errors.pan ? inputError : inputNormal}
                />
              )}
            />
            {errors.pan && <p className="text-xs text-destructive mt-1.5">{errors.pan.message}</p>}
          </div>
        </div>

        {/* Address */}
        <div>
          <label className={labelBase}>Address</label>
          <input
            type="text"
            placeholder="Street address"
            maxLength={200}
            {...register("address")}
            className={inputNormal}
          />
        </div>

        {/* City + Pincode */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelBase}>City</label>
            <input
              type="text"
              placeholder="Mumbai"
              maxLength={25}
              {...register("city")}
              className={inputNormal}
            />
          </div>
          <div>
            <label className={labelBase}>Pincode</label>
            <input
              type="text"
              placeholder="400001"
              maxLength={6}
              {...register("pincode", pincodeRules)}
              className={errors.pincode ? inputError : inputNormal}
            />
            {errors.pincode && <p className="text-xs text-destructive mt-1.5">{errors.pincode.message}</p>}
          </div>
        </div>

        {/* State */}
        <div>
          <label className={labelBase}>State</label>
          <Controller
            name="state"
            control={control}
            render={({ field }) => (
              <select {...field} className={inputNormal}>
                <option value="">Select state</option>
                {STATES.map((s) => (
                  <option key={s.key} value={s.value}>{s.label}</option>
                ))}
              </select>
            )}
          />
        </div>

        {/* Notes */}
        <div>
          <label className={labelBase}>Notes</label>
          <textarea
            rows={2}
            placeholder="Any notes about this vendor"
            maxLength={500}
            {...register("notes")}
            className={`${inputNormal} resize-none`}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2 sticky bottom-0 bg-card pb-1">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-2.5 border border-border text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition"
          >
            {isSubmitting ? "Adding…" : "Add Vendor"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
