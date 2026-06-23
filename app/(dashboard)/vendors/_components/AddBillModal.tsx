import { useForm, Controller } from "react-hook-form";
import { Bill, CreateBillPayload, Vendor } from "@/types/vendor";
import { createBill } from "@/lib/vendors";
import Modal from "@/components/shared/Modal";

const inputBase =
  "w-full px-3 py-2.5 bg-background border rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all placeholder:text-muted-foreground/60";
const inputNormal = `${inputBase} border-input`;
const inputError = `${inputBase} border-destructive bg-destructive/5`;
const labelBase =
  "block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5";

const GST_RATES = [0, 5, 12, 18, 28];

type BillForm = {
  vendorId: string;
  billNumber: string;
  description: string;
  taxableAmount: number;
  gstRate: number;
  dueDate: string;
  notes: string;
};

interface Props {
  isOpen: boolean;
  businessId: string;
  vendors: Vendor[];
  onClose: () => void;
  onCreated: (bill: Bill) => void;
}

export default function AddBillModal({
  isOpen,
  businessId,
  vendors,
  onClose,
  onCreated,
}: Props) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BillForm>({
    defaultValues: {
      vendorId: "",
      billNumber: "",
      description: "",
      taxableAmount: 0,
      gstRate: 18,
      dueDate: "",
      notes: "",
    },
  });

  const taxableAmount = watch("taxableAmount");
  const gstRate = watch("gstRate");
  const selectedVendor = vendors.find((v) => v.id === watch("vendorId"));
  const gstAmount = ((Number(taxableAmount) || 0) * (Number(gstRate) || 0)) / 100;
  const isReverseCharge = selectedVendor?.isForeign ?? false;
  const total = isReverseCharge
    ? Number(taxableAmount) || 0
    : (Number(taxableAmount) || 0) + gstAmount;

  const onSubmit = async (values: BillForm) => {
    try {
      const payload: CreateBillPayload = {
        businessId,
        vendorId: values.vendorId,
        description: values.description,
        taxableAmount: Number(values.taxableAmount),
        gstRate: Number(values.gstRate),
        dueDate: values.dueDate,
        billNumber: values.billNumber || undefined,
        notes: values.notes || undefined,
      };
      const bill = await createBill(payload);
      onCreated({ ...bill, payments: [] });
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
      title="Add Bill"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
        <div>
          <label className={labelBase}>
            Vendor <span className="text-destructive">*</span>
          </label>
          <Controller
            name="vendorId"
            control={control}
            rules={{ required: "Select a vendor" }}
            render={({ field }) => (
              <select
                {...field}
                className={errors.vendorId ? inputError : inputNormal}
              >
                <option value="">Select vendor</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                    {v.isForeign ? " (Foreign)" : ""}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.vendorId && (
            <p className="text-xs text-destructive mt-1.5">
              {errors.vendorId.message}
            </p>
          )}
        </div>

        <div>
          <label className={labelBase}>
            Description <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. AWS Invoice, Office Rent"
            {...register("description", {
              required: "Description is required",
            })}
            className={errors.description ? inputError : inputNormal}
          />
          {errors.description && (
            <p className="text-xs text-destructive mt-1.5">
              {errors.description.message}
            </p>
          )}
        </div>

        <div>
          <label className={labelBase}>Bill Number</label>
          <input
            type="text"
            placeholder="INV-001 (optional)"
            {...register("billNumber")}
            className={inputNormal}
          />
        </div>

        {/* Taxable Amount + GST Rate */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelBase}>
              Taxable Amount (₹) <span className="text-destructive">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min={0}
              placeholder="0"
              {...register("taxableAmount", {
                required: "Required",
                validate: (v) => Number(v) > 0 || "Must be greater than 0",
              })}
              className={errors.taxableAmount ? inputError : inputNormal}
            />
            {errors.taxableAmount && (
              <p className="text-xs text-destructive mt-1.5">
                {errors.taxableAmount.message}
              </p>
            )}
          </div>
          <div>
            <label className={labelBase}>GST Rate</label>
            <select {...register("gstRate")} className={inputNormal}>
              {GST_RATES.map((r) => (
                <option key={r} value={r}>
                  {r}%
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live tax preview */}
        <div className="rounded-lg bg-muted/50 border border-border p-3 space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Taxable</span>
            <span className="tabular-nums">
              ₹{(Number(taxableAmount) || 0).toLocaleString("en-IN")}
            </span>
          </div>
          {isReverseCharge ? (
            <div className="flex justify-between text-status-pending-foreground">
              <span>IGST {gstRate}% (Reverse Charge — you pay govt)</span>
              <span className="tabular-nums">
                ₹{gstAmount.toLocaleString("en-IN")}
              </span>
            </div>
          ) : (
            <div className="flex justify-between text-muted-foreground">
              <span>GST {gstRate}%</span>
              <span className="tabular-nums">
                ₹{gstAmount.toLocaleString("en-IN")}
              </span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-foreground pt-1.5 border-t border-border">
            <span>{isReverseCharge ? "Payable to vendor" : "Total"}</span>
            <span className="tabular-nums">
              ₹{total.toLocaleString("en-IN")}
            </span>
          </div>
          {isReverseCharge && (
            <p className="text-xs text-muted-foreground pt-1">
              Foreign vendor — IGST is self-assessed under reverse charge.
              Confirm treatment with your CA.
            </p>
          )}
        </div>

        <div>
          <label className={labelBase}>
            Due Date <span className="text-destructive">*</span>
          </label>
          <input
            type="date"
            {...register("dueDate", { required: "Due date is required" })}
            className={errors.dueDate ? inputError : inputNormal}
          />
          {errors.dueDate && (
            <p className="text-xs text-destructive mt-1.5">
              {errors.dueDate.message}
            </p>
          )}
        </div>

        <div>
          <label className={labelBase}>Notes</label>
          <textarea
            rows={2}
            placeholder="Any notes about this bill"
            {...register("notes")}
            className={`${inputNormal} resize-none`}
          />
        </div>

        <div className="flex gap-3 pt-2">
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
            {isSubmitting ? "Adding..." : "Add Bill"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
