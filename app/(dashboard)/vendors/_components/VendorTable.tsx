import Link from "next/link";
import { Vendor } from "@/types/vendor";

interface Props {
  vendors: Vendor[];
  onDelete: (id: string) => void;
}

export default function VendorTable({ vendors, onDelete }: Props) {
  if (vendors.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        No vendors yet. Add your first vendor.
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead className="bg-muted/60 border-b border-border">
        <tr>
          {["Name", "Phone", "GSTIN", "State", "Bills"].map((h) => (
            <th
              key={h}
              className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
            >
              {h}
            </th>
          ))}
          <th className="px-4 py-3" />
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {vendors.map((vendor) => (
          <tr key={vendor.id} className="hover:bg-muted/30 transition">
            <td className="px-4 py-3 font-medium text-foreground">
              <Link
                href={`/vendors/${vendor.id}`}
                className="hover:text-primary transition"
              >
                {vendor.name}
              </Link>
            </td>
            <td className="px-4 py-3 text-muted-foreground">
              {vendor.phone ?? "—"}
            </td>
            <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
              {vendor.gstin ?? "—"}
            </td>
            <td className="px-4 py-3 text-muted-foreground">
              {vendor.state ?? "—"}
            </td>
            <td className="px-4 py-3 text-muted-foreground">
              {vendor._count?.bills ?? 0}
            </td>
            <td className="px-4 py-3 text-right">
              <button
                onClick={() => onDelete(vendor.id)}
                className="text-destructive hover:text-destructive/70 text-xs transition"
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
