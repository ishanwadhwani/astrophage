import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Bill, PaymentMode, RecordBillPaymentPayload } from "@/types/vendor";
import { recordBillPayment } from "@/lib/vendors";
import Modal from "@/components/shared/Modal";

const PAYMENT_MODES: { value: PaymentMode; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CARD", label: "Card" },
];

const inputBase =
  "w-full px-3 py-2.5 bg-background border rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all placeholder:text-muted-foreground/60";
const inputNormal = `${inputBase} border-input`;
const inputError = `${inputBase} border-destructive bg-destructive/5`;
const labelBase =
  "block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5";

const fmt = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2 });

const getOutstanding = (bill: Bill) => {
  const paid = (bill.payments ?? []).reduce((s, p) => s + p.amount, 0);
  return bill.amount - paid;
};

type PaymentForm = {
  amount: number;
  mode: PaymentMode;
  referenceNumber: string;
  paymentDate: string;
  notes: string;
};

interface Props {
  bill: Bill | null;
  onClose: () => void;
  onPaid: (billId: string, newStatus: string, amountPaid: number) => void;
}

export default function RecordBillPaymentModal({
  bill,
  onClose,
  onPaid,
}: Props) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PaymentForm>({
    defaultValues: {
      amount: 0,
      mode: "UPI",
      referenceNumber: "",
      paymentDate: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  useEffect(() => {
    if (bill) {
      reset((prev) => ({ ...prev, amount: getOutstanding(bill) }));
    }
  }, [bill, reset]);

  const onSubmit = async (values: PaymentForm) => {
    if (!bill) return;
    try {
      const payload: RecordBillPaymentPayload = {
        billId: bill.id,
        amount: values.amount,
        mode: values.mode,
        referenceNumber: values.referenceNumber || undefined,
        paymentDate: values.paymentDate || undefined,
        notes: values.notes || undefined,
      };
      const result = await recordBillPayment(payload);
      onPaid(bill.id, result.billStatus, values.amount);
      reset();
      onClose();
    } catch {}
  };

  return (
    <Modal
      isOpen={!!bill}
      onClose={() => {
        onClose();
        reset();
      }}
      title={`Pay Bill — ${bill?.description ?? ""}`}
    >
      {bill && (
        <div className="mb-4 p-3 bg-muted/60 rounded-xl">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Vendor</span>
            <span className="font-medium text-foreground">
              {bill.vendor.name}
            </span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-muted-foreground">Outstanding</span>
            <span className="font-bold text-status-overdue-foreground">
              {fmt(getOutstanding(bill))}
            </span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
        <div>
          <label className={labelBase}>
            Amount (₹) <span className="text-destructive">*</span>
          </label>
          <input
            type="number"
            min="1"
            step="0.01"
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
            Payment Mode <span className="text-destructive">*</span>
          </label>
          <Controller
            name="mode"
            control={control}
            render={({ field }) => (
              <select {...field} className={inputNormal}>
                {PAYMENT_MODES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            )}
          />
        </div>

        <div>
          <label className={labelBase}>Reference No.</label>
          <input
            type="text"
            placeholder="UTR / transaction ID"
            {...register("referenceNumber")}
            className={inputNormal}
          />
        </div>

        <div>
          <label className={labelBase}>Payment Date</label>
          <input
            type="date"
            {...register("paymentDate")}
            className={inputNormal}
          />
        </div>

        <div>
          <label className={labelBase}>Notes</label>
          <input
            type="text"
            placeholder="Optional note"
            {...register("notes")}
            className={inputNormal}
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
            {isSubmitting ? "Recording..." : "Record Payment"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
