"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";

import { getUser } from "@/lib/auth";
import { updateBusiness, saveBankDetails } from "@/lib/business";
import { STATES } from "@/constants/invoice-options";

type Step = 1 | 2;

type BusinessForm = {
  name: string;
  gstin: string;
  pan: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
};

type BankForm = {
  accountName: string;
  accountNumber: string;
  ifsc: string;
  accountType: string;
  bankName: string;
};

const ACCOUNT_TYPES = ["Current", "Savings", "OD", "CC"];

const inputBase =
  "w-full px-3 py-2.5 bg-background border rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all placeholder:text-muted-foreground/60";
const inputNormal = `${inputBase} border-input`;
const inputError = `${inputBase} border-destructive bg-destructive/5`;
const labelBase =
  "block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1.5">{message}</p>;
}

export default function OnboardingPage() {
  const router = useRouter();
  const user = getUser();
  const businessId = user?.business?.id;

  const [step, setStep] = useState<Step>(1);

  // business form
  const {
    register: regB,
    control: ctrlB,
    handleSubmit: handleB,
    formState: { errors: errB, isSubmitting: subB },
  } = useForm<BusinessForm>({
    defaultValues: {
      name: user?.business?.name ?? "",
      gstin: "",
      pan: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
    },
  });

  // bank form
  const {
    register: regK,
    control: ctrlK,
    handleSubmit: handleK,
    formState: { errors: errK, isSubmitting: subK },
  } = useForm<BankForm>({
    defaultValues: {
      accountName: "",
      accountNumber: "",
      ifsc: "",
      accountType: "Current",
      bankName: "",
    },
  });

  const onSaveBusiness = async (values: BusinessForm) => {
    try {
      await updateBusiness(businessId, values);
      setStep(2);
    } catch {}
  };

  const onSaveBank = async (values: BankForm) => {
    try {
      await saveBankDetails(businessId, values);
      router.push("/dashboard");
    } catch {}
  };

  const skip = () => router.push("/dashboard");

  return (
    <div className="w-full max-w-lg">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
            </svg>
          </div>
          <span className="text-xl font-bold text-foreground">
            CashFlow Command
          </span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          {step === 1 ? "Set up your business" : "Add bank details"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {step === 1
            ? "This appears on every invoice you generate"
            : "Clients will use these details to pay you"}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {([1, 2] as Step[]).map((s) => (
          <div
            key={s}
            className={`flex-1 h-1.5 rounded-full transition-all ${
              s <= step ? "bg-primary" : "bg-border"
            }`}
          />
        ))}
      </div>

      {/* Step 1 — Business profile */}
      {step === 1 && (
        <form
          onSubmit={handleB(onSaveBusiness)}
          noValidate
          className="bg-card border border-border rounded-2xl p-6 space-y-4"
        >
          <div>
            <label className={labelBase}>
              Business Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              placeholder="Your company name"
              {...regB("name", { required: "Business name is required" })}
              className={errB.name ? inputError : inputNormal}
            />
            <FieldError message={errB.name?.message} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelBase}>GSTIN</label>
              <input
                type="text"
                placeholder="09AAHCN9733B1ZC"
                {...regB("gstin")}
                className={inputNormal}
              />
            </div>
            <div>
              <label className={labelBase}>PAN</label>
              <input
                type="text"
                placeholder="AAHCN9733B"
                {...regB("pan")}
                className={inputNormal}
              />
            </div>
          </div>

          <div>
            <label className={labelBase}>Street Address</label>
            <input
              type="text"
              placeholder="Building, Street"
              {...regB("address")}
              className={inputNormal}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelBase}>City</label>
              <input
                type="text"
                placeholder="Lucknow"
                {...regB("city")}
                className={inputNormal}
              />
            </div>
            <div>
              <label className={labelBase}>Pincode</label>
              <input
                type="text"
                placeholder="226001"
                {...regB("pincode")}
                className={inputNormal}
              />
            </div>
          </div>

          <div>
            <label className={labelBase}>
              State <span className="text-destructive">*</span>
            </label>
            <Controller
              name="state"
              control={ctrlB}
              rules={{ required: "State is required" }}
              render={({ field }) => (
                <select
                  {...field}
                  className={errB.state ? inputError : inputNormal}
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
            <FieldError message={errB.state?.message} />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={skip}
              className="flex-1 py-2.5 border border-border text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted transition"
            >
              Skip for now
            </button>
            <button
              type="submit"
              disabled={subB}
              className="flex-1 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition"
            >
              {subB ? "Saving..." : "Continue →"}
            </button>
          </div>
        </form>
      )}

      {/* Step 2 — Bank details */}
      {step === 2 && (
        <form
          onSubmit={handleK(onSaveBank)}
          noValidate
          className="bg-card border border-border rounded-2xl p-6 space-y-4"
        >
          <div>
            <label className={labelBase}>
              Account Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              placeholder="Your Business Name Pvt Ltd"
              {...regK("accountName", { required: "Account name is required" })}
              className={errK.accountName ? inputError : inputNormal}
            />
            <FieldError message={errK.accountName?.message} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelBase}>
                Account Number <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                placeholder="126505001758"
                {...regK("accountNumber", { required: "Required" })}
                className={errK.accountNumber ? inputError : inputNormal}
              />
              <FieldError message={errK.accountNumber?.message} />
            </div>
            <div>
              <label className={labelBase}>
                IFSC Code <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                placeholder="ICIC0001265"
                {...regK("ifsc", { required: "Required" })}
                className={errK.ifsc ? inputError : inputNormal}
              />
              <FieldError message={errK.ifsc?.message} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelBase}>
                Bank Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                placeholder="ICICI Bank"
                {...regK("bankName", { required: "Required" })}
                className={errK.bankName ? inputError : inputNormal}
              />
              <FieldError message={errK.bankName?.message} />
            </div>
            <div>
              <label className={labelBase}>Account Type</label>
              <Controller
                name="accountType"
                control={ctrlK}
                render={({ field }) => (
                  <select {...field} className={inputNormal}>
                    {ACCOUNT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="py-2.5 px-5 border border-border text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted transition"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={skip}
              className="flex-1 py-2.5 border border-border text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted transition"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={subK}
              className="flex-1 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition"
            >
              {subK ? "Saving..." : "Finish setup →"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
