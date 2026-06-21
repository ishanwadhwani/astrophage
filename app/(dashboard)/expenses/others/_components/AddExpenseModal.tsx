"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Expense, ExpenseCategory, EXPENSE_CATEGORIES } from "@/types/expense";
import { createExpense, updateExpense } from "@/lib/expenses";
import Modal from "@/components/shared/Modal";

const inputBase =
  "w-full px-3 py-2.5 bg-background border rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all placeholder:text-muted-foreground/60";
const inputNormal = `${inputBase} border-input`;
const inputError = `${inputBase} border-destructive bg-destructive/5`;
const labelBase =
  "block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5";

type ExpenseForm = {
  title: string;
  category: ExpenseCategory;
  amount: string;
  expenseDate: string;
  notes: string;
  isRecurring: boolean;
};

interface Props {
  isOpen: boolean;
  businessId: string;
  expense?: Expense | null;
  onClose: () => void;
  onSaved: () => void;
}

const toDateInput = (iso: string | null | undefined): string =>
  iso ? new Date(iso).toISOString().split("T")[0] : "";

export default function AddExpenseModal({
  isOpen,
  businessId,
  expense,
  onClose,
  onSaved,
}: Props) {
  const isEdit = Boolean(expense);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseForm>({
    defaultValues: {
      title: "",
      category: "MISCELLANEOUS",
      amount: "",
      expenseDate: toDateInput(new Date().toISOString()),
      notes: "",
      isRecurring: false,
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    if (expense) {
      reset({
        title: expense.title,
        category: expense.category,
        amount: String(expense.amount),
        expenseDate: toDateInput(expense.expenseDate),
        notes: expense.notes ?? "",
        isRecurring: expense.isRecurring,
      });
    } else {
      reset({
        title: "",
        category: "MISCELLANEOUS",
        amount: "",
        expenseDate: toDateInput(new Date().toISOString()),
        notes: "",
        isRecurring: false,
      });
    }
  }, [isOpen, expense, reset]);

  const onSubmit = async (values: ExpenseForm) => {
    try {
      const payload = {
        title: values.title.trim(),
        category: values.category,
        amount: Number(values.amount),
        expenseDate: values.expenseDate,
        notes: values.notes.trim() || undefined,
        isRecurring: values.isRecurring,
      };
      if (isEdit && expense) {
        await updateExpense(expense.id, payload);
      } else {
        await createExpense({ ...payload, businessId });
      }
      reset();
      onSaved();
    } catch {}
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? "Edit Expense" : "Add Expense"}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-4 max-h-[70vh] overflow-y-auto overflow-x-hidden pr-2"
      >
        {/* Title */}
        <div>
          <label className={labelBase}>
            Title <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Shop rent — June"
            maxLength={100}
            {...register("title", { required: "Title is required" })}
            className={errors.title ? inputError : inputNormal}
          />
          {errors.title && (
            <p className="text-xs text-destructive mt-1.5">
              {errors.title.message}
            </p>
          )}
        </div>

        {/* Category + Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelBase}>Category</label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <select {...field} className={inputNormal}>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>
          <div>
            <label className={labelBase}>
              Amount <span className="text-destructive">*</span>
            </label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="15000"
              min={1}
              step="0.01"
              {...register("amount", {
                required: "Amount is required",
                validate: (v) =>
                  Number(v) > 0 || "Amount must be greater than zero",
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

        {/* Date */}
        <div>
          <label className={labelBase}>
            Date <span className="text-destructive">*</span>
          </label>
          <input
            type="date"
            {...register("expenseDate", { required: "Date is required" })}
            className={errors.expenseDate ? inputError : inputNormal}
          />
          {errors.expenseDate && (
            <p className="text-xs text-destructive mt-1.5">
              {errors.expenseDate.message}
            </p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className={labelBase}>Notes</label>
          <textarea
            rows={2}
            placeholder="Any details about this expense"
            maxLength={500}
            {...register("notes")}
            className={`${inputNormal} resize-none`}
          />
        </div>

        {/* Recurring toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            {...register("isRecurring")}
            className="w-4 h-4 rounded border-input accent-primary"
          />
          <span className="text-sm text-foreground">
            This is a recurring monthly expense
          </span>
        </label>

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
            {isSubmitting ? "Saving…" : isEdit ? "Save Changes" : "Add Expense"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
