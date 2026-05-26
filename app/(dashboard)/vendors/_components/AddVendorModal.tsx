import { useForm, Controller } from "react-hook-form";
import { CreateVendorPayload, Vendor } from "@/types/vendor";
import { createVendor } from "@/lib/vendors";
import Modal from "@/components/shared/Modal";
import { STATES } from "@/constants/invoice-options";

const inputBase =
  "w-full px-3 py-2.5 bg-background border rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all placeholder:text-muted-foreground/60";
const inputNormal = `${inputBase} border-input`;
const inputError = `${inputBase} border-destructive bg-destructive/5`;
const labelBase =
  "block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5";

type VendorForm = {
  name: string;
  email: string;
  phone: string;
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

export default function AddVendorModal({
  isOpen,
  businessId,
  onClose,
  onCreated,
}: Props) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VendorForm>({
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
      notes: "",
    },
  });

  const onSubmit = async (values: VendorForm) => {
    try {
      const payload: CreateVendorPayload = {
        ...values,
        businessId,
        email: values.email || undefined,
        phone: values.phone || undefined,
        gstin: values.gstin || undefined,
        pan: values.pan || undefined,
        address: values.address || undefined,
        city: values.city || undefined,
        state: values.state || undefined,
        pincode: values.pincode || undefined,
        notes: values.notes || undefined,
      };
      const vendor = await createVendor(payload);
      onCreated({ ...vendor, _count: { bills: 0 } });
      reset();
      onClose();
    } catch {}
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        reset();
      }}
      title="Add Vendor"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-3 max-h-[70vh] overflow-y-auto pr-1"
      >
        <div>
          <label className={labelBase}>
            Name <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            placeholder="Vendor or company name"
            {...register("name", { required: "Name is required" })}
            className={errors.name ? inputError : inputNormal}
          />
          {errors.name && (
            <p className="text-xs text-destructive mt-1.5">
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelBase}>Email</label>
            <input
              type="email"
              placeholder="vendor@example.com"
              {...register("email")}
              className={inputNormal}
            />
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
        </div>

        <div className="grid grid-cols-2 gap-3">
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
        </div>

        <div>
          <label className={labelBase}>Address</label>
          <input
            type="text"
            placeholder="Street address"
            {...register("address")}
            className={inputNormal}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelBase}>City</label>
            <input
              type="text"
              placeholder="Mumbai"
              {...register("city")}
              className={inputNormal}
            />
          </div>
          <div>
            <label className={labelBase}>Pincode</label>
            <input
              type="text"
              placeholder="400001"
              {...register("pincode")}
              className={inputNormal}
            />
          </div>
        </div>

        <div>
          <label className={labelBase}>State</label>
          <Controller
            name="state"
            control={control}
            render={({ field }) => (
              <select {...field} className={inputNormal}>
                <option value="">Select state</option>
                {STATES.map((s) => (
                  <option key={s.key} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            )}
          />
        </div>

        <div>
          <label className={labelBase}>Notes</label>
          <textarea
            rows={2}
            placeholder="Any notes about this vendor"
            {...register("notes")}
            className={`${inputNormal} resize-none`}
          />
        </div>

        <div className="flex gap-3 pt-2 sticky bottom-0 bg-card pb-1">
          <button
            type="button"
            onClick={() => {
              onClose();
              reset();
            }}
            className="flex-1 py-2.5 border border-border text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition"
          >
            {isSubmitting ? "Adding..." : "Add Vendor"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
