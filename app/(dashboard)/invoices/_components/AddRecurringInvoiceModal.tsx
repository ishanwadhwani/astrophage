"use client";

import { useForm, useFieldArray, Controller } from "react-hook-form";
import { PlusCircle, Trash2 } from "lucide-react";
import {
  RecurringInvoice,
  CreateRecurringInvoicePayload,
  BillFrequency,
  RecurringForm,
  RecurringInvoiceLineItem,
} from "@/types/invoice";
import { Client } from "@/types/client";
import { createRecurringInvoice } from "@/lib/invoices";
import Modal from "@/components/shared/Modal";
import { STATES, GST_RATES } from "@/constants/invoice-options";

const FREQUENCIES: { value: BillFrequency; label: string }[] = [
  { value: "WEEKLY", label: "Every week" },
  { value: "MONTHLY", label: "Every month" },
  { value: "QUARTERLY", label: "Every quarter" },
  { value: "YEARLY", label: "Every year" },
];

const DEFAULT_LINE_ITEM = {
  description: "",
  hsnSac: "",
  quantity: 1,
  rate: 0,
  gstRate: 18,
};

const inputBase =
  "w-full px-3 py-2.5 bg-background border rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all placeholder:text-muted-foreground/60";
const inputNormal = `${inputBase} border-input`;
const inputError = `${inputBase} border-destructive bg-destructive/5`;
const labelBase =
  "block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5";

interface Props {
  isOpen: boolean;
  businessId: string;
  clients: Client[];
  onClose: () => void;
  onCreated: (ri: RecurringInvoice) => void;
}

export default function AddRecurringInvoiceModal({
  isOpen,
  businessId,
  clients,
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
  } = useForm<RecurringForm>({
    defaultValues: {
      clientId: "",
      frequency: "MONTHLY",
      nextDueDate: new Date().toISOString().split("T")[0],
      placeOfSupply: "",
      isGstInvoice: false,
      notes: "",
      lineItems: [DEFAULT_LINE_ITEM],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lineItems",
  });

  const watchedLineItems: RecurringInvoiceLineItem[] = watch("lineItems");
  const watchedFrequency = watch("frequency");

  const computedItems = watchedLineItems.map((item) => {
    const amount = (item.quantity || 0) * (item.rate || 0);
    const tax = (amount * (item.gstRate || 0)) / 100;
    return { amount, tax, total: amount + tax };
  });
  const subtotal = computedItems.reduce((s, i) => s + i.amount, 0);
  const totalTax = computedItems.reduce((s, i) => s + i.tax, 0);
  const grandTotal = subtotal + totalTax;

  const fmt = (n: number) =>
    "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2 });

  const freqLabel =
    FREQUENCIES.find((f) => f.value === watchedFrequency)
      ?.label?.replace("Every ", "")
      ?.toLowerCase() ?? "cycle";

  const onSubmit = async (values: RecurringForm) => {
    try {
      const payload: CreateRecurringInvoicePayload = {
        businessId,
        clientId: values.clientId,
        lineItems: values.lineItems.map((item) => ({
          description: item.description,
          hsnSac: item.hsnSac || undefined,
          quantity: item.quantity,
          rate: item.rate,
          gstRate: item.gstRate,
        })),
        frequency: values.frequency,
        nextDueDate: values.nextDueDate,
        placeOfSupply: values.placeOfSupply,
        isGstInvoice: values.isGstInvoice,
        notes: values.notes || undefined,
      };
      const ri = await createRecurringInvoice(payload);
      onCreated(ri);
      reset();
      onClose();
    } catch {}
  };

  const handleClose = () => {
    onClose();
    reset();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Set Up Recurring Invoice">
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-4 max-h-[70vh] overflow-y-auto pr-1"
      >
        {/* Client */}
        <div>
          <label className={labelBase}>
            Client <span className="text-destructive">*</span>
          </label>
          <Controller
            name="clientId"
            control={control}
            rules={{ required: "Select a client" }}
            render={({ field }) => (
              <select
                {...field}
                className={errors.clientId ? inputError : inputNormal}
              >
                <option value="">Select client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.clientId && (
            <p className="text-xs text-destructive mt-1.5">
              {errors.clientId.message}
            </p>
          )}
        </div>

        {/* Frequency + First Invoice Date */}
        <div className="grid grid-cols-2 gap-3">
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
          <div>
            <label className={labelBase}>
              First Invoice Date <span className="text-destructive">*</span>
            </label>
            <input
              type="date"
              {...register("nextDueDate", { required: "Required" })}
              className={errors.nextDueDate ? inputError : inputNormal}
            />
            {errors.nextDueDate && (
              <p className="text-xs text-destructive mt-1.5">
                {errors.nextDueDate.message}
              </p>
            )}
          </div>
        </div>

        {/* Place of Supply */}
        <div>
          <label className={labelBase}>
            Place of Supply <span className="text-destructive">*</span>
          </label>
          <Controller
            name="placeOfSupply"
            control={control}
            rules={{ required: "Required" }}
            render={({ field }) => (
              <select
                {...field}
                className={errors.placeOfSupply ? inputError : inputNormal}
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
          {errors.placeOfSupply && (
            <p className="text-xs text-destructive mt-1.5">
              {errors.placeOfSupply.message}
            </p>
          )}
        </div>

        {/* Line items */}
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-muted/30 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Line Items
            </p>
          </div>

          <div className="p-4 space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className={`space-y-2.5 ${
                  index < fields.length - 1
                    ? "pb-4 border-b border-border/60"
                    : ""
                }`}
              >
                {/* Item header */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Item {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    title="Remove item"
                    className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Description */}
                <input
                  type="text"
                  placeholder="Description *"
                  {...register(`lineItems.${index}.description`, {
                    required: "Required",
                  })}
                  className={
                    errors.lineItems?.[index]?.description
                      ? inputError
                      : inputNormal
                  }
                />

                {/* HSN + Qty */}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="HSN/SAC"
                    {...register(`lineItems.${index}.hsnSac`)}
                    className={inputNormal}
                  />
                  <input
                    type="number"
                    placeholder="Quantity"
                    min="1"
                    {...register(`lineItems.${index}.quantity`, {
                      valueAsNumber: true,
                      min: 1,
                    })}
                    className={inputNormal}
                  />
                </div>

                {/* Rate + GST */}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Rate (₹)"
                    min="0"
                    step="0.01"
                    {...register(`lineItems.${index}.rate`, {
                      valueAsNumber: true,
                      min: 0,
                    })}
                    className={inputNormal}
                  />
                  <Controller
                    name={`lineItems.${index}.gstRate`}
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                        className={inputNormal}
                      >
                        {GST_RATES.map((r) => (
                          <option key={r.label} value={r.value}>
                            {r.value}% GST
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </div>

                {/* Item total */}
                <div className="flex justify-end text-xs text-muted-foreground">
                  Item total:{" "}
                  <span className="font-semibold text-foreground ml-1 tabular-nums">
                    {fmt(computedItems[index]?.total ?? 0)}
                  </span>
                </div>
              </div>
            ))}

            {/* Add item */}
            <button
              type="button"
              onClick={() => append(DEFAULT_LINE_ITEM)}
              className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-semibold transition-colors group"
            >
              <PlusCircle className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
              Add line item
            </button>

            {/* Totals */}
            <div className="border-t border-border pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="tabular-nums">{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span className="tabular-nums">{fmt(totalTax)}</span>
              </div>
              <div className="flex justify-between font-bold text-foreground text-sm pt-1 border-t border-border">
                <span className="capitalize">Per {freqLabel}</span>
                <span className="text-primary tabular-nums">
                  {fmt(grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* GST Invoice */}
        <label className="flex items-center gap-3 p-3 bg-muted/60 border border-border/50 rounded-xl cursor-pointer hover:bg-muted/80 transition-colors">
          <Controller
            name="isGstInvoice"
            control={control}
            render={({ field }) => (
              <input
                type="checkbox"
                id="ri_gst"
                checked={field.value}
                onChange={field.onChange}
                className="w-4 h-4 accent-primary"
              />
            )}
          />
          <div>
            <p className="text-sm font-medium text-foreground">
              Mark as GST Invoice
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Required for GST filing compliance
            </p>
          </div>
        </label>

        {/* Notes */}
        <div>
          <label className={labelBase}>Notes</label>
          <textarea
            rows={2}
            placeholder="Optional notes for this recurring invoice..."
            {...register("notes")}
            className={`${inputNormal} resize-none`}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2 sticky bottom-0 bg-card pb-1">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-2.5 border border-border text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all duration-200"
          >
            {isSubmitting ? "Saving..." : "Set Up Recurring"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
