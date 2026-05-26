import { Vendor, Bill } from "@/types/vendor";

const fmt = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2 });

const getOutstanding = (bill: Bill) => {
  const paid = (bill.payments ?? []).reduce((s, p) => s + p.amount, 0);
  return bill.amount - paid;
};

interface Props {
  vendors: Vendor[];
  bills: Bill[];
}

export default function VendorStats({ vendors, bills }: Props) {
  const totalPayables = bills
    .filter((b) => b.status !== "PAID" && b.status !== "CANCELLED")
    .reduce((s, b) => s + getOutstanding(b), 0);

  const overduePayables = bills
    .filter((b) => b.status === "OVERDUE")
    .reduce((s, b) => s + getOutstanding(b), 0);

  const openBills = bills.filter(
    (b) => b.status === "PENDING" || b.status === "OVERDUE",
  ).length;

  const stats = [
    { label: "Total Vendors", value: String(vendors.length), danger: false },
    { label: "Total Payables", value: fmt(totalPayables), danger: false },
    {
      label: "Overdue Bills",
      value: fmt(overduePayables),
      danger: overduePayables > 0,
    },
    { label: "Open Bills", value: String(openBills), danger: false },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-card border border-border rounded-2xl p-5"
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            {s.label}
          </p>
          <p
            className={`text-2xl font-bold ${
              s.danger ? "text-status-overdue-foreground" : "text-foreground"
            }`}
          >
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}
