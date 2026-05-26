import { DashboardInvoice } from "@/types/dashboard";
import { Invoice } from "@/types/invoice";

export const openWhatsApp = (phone: string, message: string): void => {
  const clean = phone.replace(/\D/g, "");
  const with91 = clean.startsWith("91") ? clean : `91${clean}`;
  const encoded = encodeURIComponent(message);
  window.open(`https://wa.me/${with91}?text=${encoded}`, "_blank");
};

export const invoiceReminderMessage = (
  invoice: DashboardInvoice | Invoice,
  businessName: string,
): string => {
  const number =
    "number" in invoice ? invoice.number : (invoice as DashboardInvoice).number;
  const client =
    "clientName" in invoice
      ? (invoice as DashboardInvoice).clientName
      : (invoice as Invoice).client?.name;
  const amount =
    "outstanding" in invoice ? invoice.outstanding : (invoice as Invoice).total;
  const due = new Date(
    (invoice as DashboardInvoice).dueDate ?? (invoice as Invoice).dueDate,
  ).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `Hi ${client},

This is a gentle reminder that Invoice #${number} for ₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })} was due on ${due}.

Kindly arrange the payment at your earliest convenience.

Thank you,
${businessName}`;
};
