"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Employee } from "@/types/employee";
import { createEmployee, updateEmployee } from "@/lib/employees";
import Modal from "@/components/shared/Modal";
import { emailRules, phoneRules, formatPhone } from "@/lib/validators";

const inputBase =
  "w-full px-3 py-2.5 bg-background border rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all placeholder:text-muted-foreground/60";
const inputNormal = `${inputBase} border-input`;
const inputError = `${inputBase} border-destructive bg-destructive/5`;
const labelBase =
  "block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5";

type EmployeeForm = {
  name: string;
  role: string;
  monthlySalary: string; // string in form, parsed on submit
  startDate: string;
  exitDate: string;
  email: string;
  phone: string;
  countryCode: string;
};

interface Props {
  isOpen: boolean;
  businessId: string;
  employee?: Employee | null; // present = edit mode
  onClose: () => void;
  onSaved: () => void;
}

// yyyy-mm-dd for <input type="date">
const toDateInput = (iso: string | null | undefined): string =>
  iso ? new Date(iso).toISOString().split("T")[0] : "";

export default function AddEmployeeModal({
  isOpen,
  businessId,
  employee,
  onClose,
  onSaved,
}: Props) {
  const isEdit = Boolean(employee);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeForm>({
    defaultValues: {
      name: "",
      role: "",
      monthlySalary: "",
      startDate: "",
      exitDate: "",
      email: "",
      phone: "",
      countryCode: "+91",
    },
  });

  // Populate fields when opening (edit) or reset (add)
  useEffect(() => {
    if (!isOpen) return;
    if (employee) {
      reset({
        name: employee.name,
        role: employee.role ?? "",
        monthlySalary: String(employee.monthlySalary),
        startDate: toDateInput(employee.startDate),
        exitDate: toDateInput(employee.exitDate),
        email: employee.email ?? "",
        phone: employee.phone ?? "",
        countryCode: "+91",
      });
    } else {
      reset({
        name: "",
        role: "",
        monthlySalary: "",
        startDate: "",
        exitDate: "",
        email: "",
        phone: "",
        countryCode: "+91",
      });
    }
  }, [isOpen, employee, reset]);

  const startDate = watch("startDate");

  const onSubmit = async (values: EmployeeForm) => {
    try {
      const payload = {
        name: values.name.trim(),
        role: values.role.trim() || undefined,
        monthlySalary: Number(values.monthlySalary),
        startDate: values.startDate,
        exitDate: values.exitDate || null,
        email: values.email.trim() || undefined,
        phone: values.phone.trim() || undefined,
      };

      if (isEdit && employee) {
        await updateEmployee(employee.id, payload);
      } else {
        await createEmployee({ ...payload, businessId });
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
      title={isEdit ? "Edit Employee" : "Add Employee"}
    >
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
            placeholder="Employee full name"
            maxLength={100}
            {...register("name", { required: "Name is required" })}
            className={errors.name ? inputError : inputNormal}
          />
          {errors.name && (
            <p className="text-xs text-destructive mt-1.5">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Role + Salary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelBase}>Role / Title</label>
            <input
              type="text"
              placeholder="e.g. Sales Manager"
              maxLength={60}
              {...register("role")}
              className={inputNormal}
            />
          </div>
          <div>
            <label className={labelBase}>
              Monthly Salary <span className="text-destructive">*</span>
            </label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="25000"
              min={1}
              step="0.01"
              {...register("monthlySalary", {
                required: "Salary is required",
                validate: (v) =>
                  Number(v) > 0 || "Salary must be greater than zero",
              })}
              className={errors.monthlySalary ? inputError : inputNormal}
            />
            {errors.monthlySalary && (
              <p className="text-xs text-destructive mt-1.5">
                {errors.monthlySalary.message}
              </p>
            )}
          </div>
        </div>

        {/* Start + Exit date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelBase}>
              Start Date <span className="text-destructive">*</span>
            </label>
            <input
              type="date"
              {...register("startDate", { required: "Start date is required" })}
              className={errors.startDate ? inputError : inputNormal}
            />
            {errors.startDate && (
              <p className="text-xs text-destructive mt-1.5">
                {errors.startDate.message}
              </p>
            )}
          </div>
          <div>
            <label className={labelBase}>Exit Date</label>
            <input
              type="date"
              min={startDate || undefined}
              {...register("exitDate", {
                validate: (v) =>
                  !v ||
                  !startDate ||
                  v >= startDate ||
                  "Exit date cannot be before start date",
              })}
              className={errors.exitDate ? inputError : inputNormal}
            />
            {errors.exitDate ? (
              <p className="text-xs text-destructive mt-1.5">
                {errors.exitDate.message}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1.5">
                Leave blank if still employed
              </p>
            )}
          </div>
        </div>

        {/* Email + Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelBase}>Email</label>
            <input
              type="email"
              placeholder="employee@example.com"
              {...register("email", emailRules)}
              className={errors.email ? inputError : inputNormal}
            />
            {errors.email && (
              <p className="text-xs text-destructive mt-1.5">
                {errors.email.message}
              </p>
            )}
          </div>
          {/* Phone */}
          <div>
            <label className={labelBase}>Phone</label>
            <div className="flex gap-2">
              <select
                {...register("countryCode")}
                className={`shrink-0 text-sm text-center px-1`}
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
                    onChange={(e) =>
                      field.onChange(formatPhone(e.target.value))
                    }
                    className={`${errors.phone ? inputError : inputNormal} flex-1 min-w-0`}
                  />
                )}
              />
            </div>
            {errors.phone && (
              <p className="text-xs text-destructive mt-1.5">
                {errors.phone.message}
              </p>
            )}
          </div>
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
            {isSubmitting
              ? "Saving…"
              : isEdit
                ? "Save Changes"
                : "Add Employee"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
