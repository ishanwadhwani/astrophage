"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useFieldArray, Controller, useWatch } from "react-hook-form";

import { Client } from "@/types/client";
import { LineItemInput, CreateInvoicePayload } from "@/types/invoice";
import { fetchClients } from "@/lib/clients";
import { createInvoice } from "@/lib/invoices";
import { fetchBusiness, fetchNextInvoiceNumber } from "@/lib/business";
import { useBusiness } from "@/hooks/useBusiness";
// import { getUser } from "@/lib/auth";
import { GST_RATES, STATES } from "@/constants/invoice-options";

const DEFAULT_LINE_ITEM: LineItemInput = {
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

function SectionCard({
  step,
  title,
  children,
}: {
  step: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-muted/40">
        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0">
          {step}
        </span>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1.5">{message}</p>;
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const isDraftRef = useRef(false);
  //   const user = getUser();
  const { businessId } = useBusiness();
  const [clients, setClients] = useState<Client[]>([]);
  const [businessStateWarning, setBusinessStateWarning] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateInvoicePayload>({
    defaultValues: {
      number: "",
      clientId: "",
      dueDate: "",
      placeOfSupply: "",
      notes: "",
      isGstInvoice: false,
      lineItems: [DEFAULT_LINE_ITEM],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lineItems",
  });

  const watchedLineItems = useWatch({ control, name: "lineItems" }) || [];
  const watchedClientId = useWatch({ control, name: "clientId" }) || [];
  const watchedNumber = useWatch({ control, name: "number" });
  const watchedDueDate = useWatch({ control, name: "dueDate" });
  const watchedPlaceOfSupply = useWatch({ control, name: "placeOfSupply" });

  useEffect(() => {
    if (!businessId) return;

    const fetchData = async () => {
      try {
        const [clients, business, number] = await Promise.all([
          fetchClients(businessId),
          fetchBusiness(businessId),
          fetchNextInvoiceNumber(businessId),
        ]);
        setClients(clients);
        setValue("number", number);

        if (!business.state) {
          setBusinessStateWarning(true);
        }
      } catch {}
    };

    void fetchData();
  }, [businessId, setValue]);

  useEffect(() => {
    if (!businessId) return;

    const fetchNumber = async () => {
      try {
        const number = await fetchNextInvoiceNumber(businessId);
        setValue("number", number);
      } catch {}
    };

    void fetchNumber();
  }, [businessId, setValue]);

  const computedItems = watchedLineItems.map((item) => {
    const amount = (item.quantity || 0) * (item.rate || 0);
    const tax = (amount * (item.gstRate || 0)) / 100;
    return { amount, tax, total: amount + tax };
  });

  const subtotal = computedItems.reduce((s, i) => s + i.amount, 0);
  const totalTax = computedItems.reduce((s, i) => s + i.tax, 0);
  const grandTotal = subtotal + totalTax;

  const selectedClient = clients.find((c) => c.id === watchedClientId);

  const taxByRate = watchedLineItems.reduce<Record<number, number>>(
    (acc, item, i) => {
      const rate = item.gstRate || 0;
      acc[rate] = (acc[rate] || 0) + computedItems[i].tax;
      return acc;
    },
    {},
  );

  const onSubmit = async (values: CreateInvoicePayload) => {
    setServerError("");
    try {
      const payload: CreateInvoicePayload = {
        ...values,
        businessId,
        saveAsDraft: isDraftRef.current,
        lineItems: values.lineItems.map((item) => ({
          ...item,
          hsnSac: item.hsnSac || undefined,
        })),
      };
      const invoice = await createInvoice(payload);
      router.push(`/invoices/${invoice.id}`);
    } catch (err: unknown) {
      let message = "Failed to create invoice";
      if (typeof err === "object" && err !== null) {
        const e = err as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        message = e.response?.data?.message || e.message || message;
      }
      setServerError(message);
    }
  };

  return (
    <div className="min-h-full">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link
            href="/invoices"
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          >
            ←
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">New Invoice</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Fill in the details to generate an invoice
            </p>
          </div>
        </div>

        <div className="flex gap-3 pb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2 border border-border text-sm font-medium rounded-lg text-foreground hover:bg-muted transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              isDraftRef.current = true;
              handleSubmit(onSubmit)();
            }}
            className="px-5 py-2 border border-border text-sm font-semibold rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-50 transition"
          >
            Save as Draft
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              isDraftRef.current = false;
              handleSubmit(onSubmit)();
            }}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm shadow-primary/20"
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              "Create Invoice →"
            )}
          </button>
        </div>
      </div>

      {businessStateWarning && (
        <div className="flex items-start gap-3 bg-status-pending/10 border border-status-pending-foreground/20 rounded-xl px-4 py-3">
          <span className="text-status-pending-foreground text-sm">⚠</span>
          <p className="text-sm text-status-pending-foreground">
            Your business state is not set. IGST will be applied to all
            invoices.{" "}
            <Link href="/settings" className="font-semibold underline">
              Fix in Settings →
            </Link>
          </p>
        </div>
      )}

      <form
        // id="invoice-form"
        // onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col lg:flex-row gap-6 items-start"
      >
        <div className="flex-1 min-w-0 space-y-4">
          {/* Invoice Details */}
          <SectionCard step="1" title="Invoice Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelBase}>
                  Invoice No <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  placeholder="A00172"
                  {...register("number", {
                    required: "Invoice number is required",
                  })}
                  className={errors.number ? inputError : inputNormal}
                />
                <FieldError message={errors.number?.message} />
              </div>

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
                <FieldError message={errors.clientId?.message} />
              </div>

              <div>
                <label className={labelBase}>
                  Due Date <span className="text-destructive">*</span>
                </label>
                <input
                  type="date"
                  {...register("dueDate", {
                    required: "Due date is required",
                  })}
                  className={errors.dueDate ? inputError : inputNormal}
                />
                <FieldError message={errors.dueDate?.message} />
              </div>

              <div>
                <label className={labelBase}>
                  Place of Supply <span className="text-destructive">*</span>
                </label>
                <Controller
                  name="placeOfSupply"
                  control={control}
                  rules={{ required: "Place of supply is required" }}
                  render={({ field }) => (
                    <select
                      {...field}
                      className={
                        errors.placeOfSupply ? inputError : inputNormal
                      }
                    >
                      <option value="">Select state</option>
                      {STATES.map((s) => (
                        <option key={s.key} value={s.value}>
                          {s.value}
                        </option>
                      ))}
                    </select>
                  )}
                />
                <div className="col-span-2 flex items-center mt-2 gap-2 p-3 bg-muted/60 rounded-xl">
                  <span className="text-xs text-muted-foreground">
                    Tax type will be:
                  </span>
                  <span className="text-xs font-bold text-foreground">
                    {watchedPlaceOfSupply
                      ? "Determined by business vs client state"
                      : "Select place of supply first"}
                  </span>
                </div>
                <FieldError message={errors.placeOfSupply?.message} />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 p-3 bg-muted/60 rounded-xl">
              <Controller
                name="isGstInvoice"
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    id="isGstInvoice"
                    checked={field.value}
                    onChange={field.onChange}
                    className="w-4 h-4 accent-primary rounded"
                  />
                )}
              />
              <div>
                <label
                  htmlFor="isGstInvoice"
                  className="text-sm font-medium text-foreground cursor-pointer"
                >
                  Mark as GST Invoice
                </label>
                <p className="text-xs text-muted-foreground">
                  Flag this invoice for GST return filing
                </p>
              </div>
            </div>
          </SectionCard>

          {/* Line Items */}
          <SectionCard step="2" title="Line Items">
            {/* Desktop table header */}
            <div className="hidden md:grid md:grid-cols-12 gap-2 mb-2 px-1">
              <p className="col-span-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Description
              </p>
              <p className="col-span-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                HSN/SAC
              </p>
              <p className="col-span-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Qty
              </p>
              <p className="col-span-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Rate (₹)
              </p>
              <p className="col-span-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                GST
              </p>
              <p className="col-span-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">
                Amount
              </p>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="group md:grid md:grid-cols-12 gap-2 flex flex-col p-3 md:p-0 border border-border md:border-0 rounded-xl md:rounded-none bg-muted/30 md:bg-transparent"
                >
                  {/* Description */}
                  <div className="md:col-span-4">
                    <label className="md:hidden text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                      Description *
                    </label>
                    <input
                      type="text"
                      placeholder="Service / product name"
                      {...register(`lineItems.${index}.description`, {
                        required: "Required",
                      })}
                      className={
                        errors.lineItems?.[index]?.description
                          ? inputError
                          : inputNormal
                      }
                    />
                    <FieldError
                      message={errors.lineItems?.[index]?.description?.message}
                    />
                  </div>

                  {/* HSN/SAC */}
                  <div className="md:col-span-2">
                    <label className="md:hidden text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                      HSN/SAC
                    </label>
                    <input
                      type="text"
                      placeholder="997331"
                      {...register(`lineItems.${index}.hsnSac`)}
                      className={inputNormal}
                    />
                  </div>

                  {/* Qty */}
                  <div className="md:col-span-1">
                    <label className="md:hidden text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                      Qty
                    </label>
                    <input
                      type="number"
                      min="1"
                      {...register(`lineItems.${index}.quantity`, {
                        required: "Required",
                        min: { value: 1, message: "Min 1" },
                        valueAsNumber: true,
                      })}
                      className={
                        errors.lineItems?.[index]?.quantity
                          ? inputError
                          : inputNormal
                      }
                    />
                  </div>

                  {/* Rate */}
                  <div className="md:col-span-2">
                    <label className="md:hidden text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                      Rate (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      {...register(`lineItems.${index}.rate`, {
                        required: "Required",
                        min: { value: 0, message: "Min 0" },
                        valueAsNumber: true,
                      })}
                      className={
                        errors.lineItems?.[index]?.rate
                          ? inputError
                          : inputNormal
                      }
                    />
                  </div>

                  {/* GST Rate */}
                  <div className="md:col-span-1">
                    <label className="md:hidden text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                      GST %
                    </label>
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
                              {r.value}%
                            </option>
                          ))}
                        </select>
                      )}
                    />
                  </div>

                  {/* Amount + Remove */}
                  <div className="md:col-span-2 flex items-center justify-between md:justify-end gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      ₹
                      {computedItems[index]?.total.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-20 transition-all"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => append(DEFAULT_LINE_ITEM)}
              className="mt-4 flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-semibold transition-colors"
            >
              <span className="w-5 h-5 rounded-full border-2 border-primary/50 flex items-center justify-center text-xs font-bold">
                +
              </span>
              Add line item
            </button>

            {/* Totals */}
            <div className="mt-6 pt-4 border-t border-border space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span>
                  ₹
                  {subtotal.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              {Object.entries(taxByRate)
                .filter(([, amount]) => amount > 0)
                .map(([rate, amount]) => (
                  <div
                    key={rate}
                    className="flex justify-between text-sm text-muted-foreground"
                  >
                    <span>GST @ {rate}%</span>
                    <span>
                      ₹
                      {amount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                ))}
              <div className="flex justify-between font-bold text-foreground text-base pt-3 border-t border-border">
                <span>Grand Total</span>
                <span className="text-primary">
                  ₹
                  {grandTotal.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </SectionCard>

          {/* Notes */}
          <SectionCard step="3" title="Notes">
            <textarea
              rows={3}
              placeholder="Payment terms, additional information, or any other notes for this invoice..."
              {...register("notes")}
              className={`${inputNormal} resize-none`}
            />
          </SectionCard>

          {serverError && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
              <span className="text-destructive text-sm">⚠</span>
              <p className="text-sm text-destructive font-medium">
                {serverError}
              </p>
            </div>
          )}

          {/* Mobile action buttons */}
          <div className="flex gap-3 lg:hidden pb-8">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-4 py-2.5 border border-border text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted transition-all"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? "Creating..." : "Create Invoice"}
            </button>
          </div>
        </div>

        <div className="w-full lg:w-80 lg:sticky lg:top-6 flex-shrink-0">
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-muted/40">
              <h3 className="text-sm font-semibold text-foreground">
                Invoice Summary
              </h3>
            </div>

            <div className="p-5 space-y-4">
              {/* Invoice meta */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-start">
                  <span className="text-xs text-muted-foreground">Invoice</span>
                  <span className="text-xs font-semibold text-foreground">
                    {watchedNumber}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-xs text-muted-foreground">Client</span>
                  <span className="text-xs font-semibold text-foreground text-right max-w-[140px] truncate">
                    {selectedClient?.name || "—"}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-xs text-muted-foreground">Due</span>
                  <span className="text-xs font-semibold text-foreground">
                    {watchedDueDate
                      ? new Date(watchedDueDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-xs text-muted-foreground">Items</span>
                  <span className="text-xs font-semibold text-foreground">
                    {fields.length}
                  </span>
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Subtotal</span>
                  <span>
                    ₹
                    {subtotal.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Tax</span>
                  <span>
                    ₹
                    {totalTax.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              {/* Grand total highlight */}
              <div className="bg-primary/8 rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  Grand Total
                </p>
                <p className="text-2xl font-bold text-primary">
                  ₹
                  {grandTotal.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>

              {/* Line item breakdown */}
              {fields.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Breakdown
                  </p>
                  {watchedLineItems.map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center gap-2"
                    >
                      <span className="text-xs text-muted-foreground truncate flex-1">
                        {item.description || `Item ${i + 1}`}
                      </span>
                      <span className="text-xs font-medium text-foreground flex-shrink-0">
                        ₹
                        {computedItems[i]?.total.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
