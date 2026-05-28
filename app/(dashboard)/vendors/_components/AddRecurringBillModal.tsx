import { useForm, Controller } from "react-hook-form";
import {
  RecurringBill,
  CreateRecurringBillPayload,
  BillFrequency,
  Vendor,
} from "@/types/vendor";
import { createRecurringBill } from "@/lib/vendors";
import Modal from "@/components/shared/Modal";

const FREQUENCIES: { value: BillFrequency; label: string }[] = [
  { value: "WEEKLY", label: "Every week" },
  { value: "MONTHLY", label: "Every month" },
  { value: "QUARTERLY", label: "Every quarter" },
  { value: "YEARLY", label: "Every year" },
];

const inputBase =
  "w-full px-3 py-2.5 bg-background border rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all placeholder:text-muted-foreground/60";
const inputNormal = `${inputBase} border-input`;
const inputError = `${inputBase} border-destructive bg-destructive/5`;
const labelBase =
  "block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5";

type RecurringForm = {
  vendorId: string;
  description: string;
  amount: number;
  frequency: BillFrequency;
  nextDueDate: string;
  notes: string;
};

interface Props {
  isOpen: boolean;
  businessId: string;
  vendors: Vendor[];
  onClose: () => void;
  onCreated: (rb: RecurringBill) => void;
}

export default function AddRecurringBillModal({
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
    formState: { errors, isSubmitting },
  } = useForm<RecurringForm>({
    defaultValues: {
      vendorId: "",
      description: "",
      amount: 0,
      frequency: "MONTHLY",
      nextDueDate: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  const onSubmit = async (values: RecurringForm) => {
    try {
      const payload: CreateRecurringBillPayload = {
        businessId,
        vendorId: values.vendorId,
        description: values.description,
        amount: values.amount,
        frequency: values.frequency,
        nextDueDate: values.nextDueDate,
        notes: values.notes || undefined,
      };
      const rb = await createRecurringBill(payload);
      onCreated(rb);
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
      title="Set Up Recurring Bill"
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
            placeholder="e.g. AWS Server, Office Rent, SaaS Subscription"
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelBase}>
              Amount (₹) <span className="text-destructive">*</span>
            </label>
            <input
              type="number"
              min="1"
              step="0.01"
              placeholder="0.00"
              {...register("amount", {
                required: "Amount is required",
                min: { value: 1, message: "Min ₹1" },
                valueAsNumber: true,
              })}
              className={errors.amount ? inputError : inputNormal}
            />
            {errors.amount && (
              <p className="text-xs text-destructive mt-1.5">
                {errors.amount.message}
              </p>
            )}
          </div>

          <div>
            <label className={labelBase}>
              Frequency <span className="text-destructive">*</span>
            </label>
            <Controller
              name="frequency"
              control={control}
              render={({ field }) => (
                <select {...field} className={inputNormal}>
                  {FREQUENCIES.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>
        </div>

        <div>
          <label className={labelBase}>
            First Due Date <span className="text-destructive">*</span>
          </label>
          <input
            type="date"
            {...register("nextDueDate", { required: "Due date is required" })}
            className={errors.nextDueDate ? inputError : inputNormal}
          />
          {errors.nextDueDate && (
            <p className="text-xs text-destructive mt-1.5">
              {errors.nextDueDate.message}
            </p>
          )}
        </div>

        <div>
          <label className={labelBase}>Notes</label>
          <textarea
            rows={2}
            placeholder="Optional notes"
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
            {isSubmitting ? "Saving..." : "Set Up Recurring"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
