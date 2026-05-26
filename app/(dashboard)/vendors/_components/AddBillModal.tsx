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

type BillForm = {
  vendorId: string;
  number: string;
  description: string;
  amount: number;
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
    formState: { errors, isSubmitting },
  } = useForm<BillForm>({
    defaultValues: {
      vendorId: "",
      number: "",
      description: "",
      amount: 0,
      dueDate: "",
      notes: "",
    },
  });

  const onSubmit = async (values: BillForm) => {
    try {
      const payload: CreateBillPayload = {
        businessId,
        vendorId: values.vendorId,
        description: values.description,
        amount: values.amount,
        dueDate: values.dueDate,
        number: values.number || undefined,
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelBase}>Bill Number</label>
            <input
              type="text"
              placeholder="INV-001 (optional)"
              {...register("number")}
              className={inputNormal}
            />
          </div>
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
