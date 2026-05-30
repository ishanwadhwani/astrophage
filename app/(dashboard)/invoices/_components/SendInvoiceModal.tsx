"use client";

import { useForm } from "react-hook-form";
import { emailInvoice } from "@/lib/invoices";
import Modal from "@/components/shared/Modal";

interface Props {
  isOpen: boolean;
  invoiceId: string;
  invoiceNumber: string;
  defaultEmail: string;
  onClose: () => void;
}

type EmailForm = { recipientEmail: string };

const inputBase =
  "w-full px-3 py-2.5 bg-background border rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all placeholder:text-muted-foreground/60";

export default function SendInvoiceModal({
  isOpen,
  invoiceId,
  invoiceNumber,
  defaultEmail,
  onClose,
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<EmailForm>({
    defaultValues: { recipientEmail: defaultEmail },
  });

  const onSubmit = async (values: EmailForm) => {
    try {
      await emailInvoice(invoiceId, values.recipientEmail);
      reset();
      onClose();
    } catch {
      setError("recipientEmail", {
        message: "Failed to send. Check the email address and try again.",
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        reset();
      }}
      title={`Send Invoice #${invoiceNumber}`}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
            Recipient Email <span className="text-destructive">*</span>
          </label>
          <input
            type="email"
            placeholder="client@example.com"
            {...register("recipientEmail", {
              required: "Email is required",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Enter a valid email address",
              },
            })}
            className={
              errors.recipientEmail
                ? `${inputBase} border-destructive bg-destructive/5`
                : `${inputBase} border-input`
            }
          />
          {errors.recipientEmail && (
            <p className="text-xs text-destructive mt-1.5">
              {errors.recipientEmail.message}
            </p>
          )}
        </div>

        <div className="bg-muted/60 rounded-xl p-3 text-xs text-muted-foreground">
          The full invoice with line items, tax breakdown, and bank details will
          be sent as a professional HTML email.
        </div>

        <div className="flex gap-3">
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
            className="flex-1 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22,2 15,22 11,13 2,9" />
                </svg>
                Send Invoice
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
