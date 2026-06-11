import Link from "next/link";
import { Building2, Trash2 } from "lucide-react";

import { Vendor } from "@/types/vendor";
import PermissionGate from "@/components/ui/PermissionGate";

const AVATAR_PALETTE = [
  "bg-primary/15 text-primary",
  "bg-chart-2/15 text-chart-2",
  "bg-chart-3/15 text-chart-3",
  "bg-chart-4/15 text-chart-4",
  "bg-chart-5/15 text-chart-5",
  "bg-accent/15 text-accent",
];

function VendorAvatar({ name }: { name: string }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const color = AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length];
  return (
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${color}`}
    >
      {initials}
    </div>
  );
}

interface Props {
  vendors: Vendor[];
  onDelete: (id: string) => void;
}

export default function VendorTable({ vendors, onDelete }: Props) {
  if (vendors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
          <Building2 className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">No vendors yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add your first vendor to track payables
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/40 border-b border-border">
            {["Vendor", "Contact", "GSTIN", "State", "Bills"].map((h) => (
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
        <tbody className="divide-y divide-border/60">
          {vendors.map((vendor) => (
            <tr
              key={vendor.id}
              className="group hover:bg-muted/30 transition-colors duration-100"
            >
              {/* Vendor name + city */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <VendorAvatar name={vendor.name} />
                  <div>
                    <Link
                      href={`/vendors/${vendor.id}`}
                      className="font-semibold text-foreground hover:text-primary transition-colors"
                    >
                      {vendor.name}
                    </Link>
                    {vendor.city && (
                      <p className="text-xs text-muted-foreground">
                        {vendor.city}
                      </p>
                    )}
                  </div>
                </div>
              </td>

              {/* Contact */}
              <td className="px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  {vendor.email && (
                    <span className="text-sm text-foreground">
                      {vendor.email}
                    </span>
                  )}
                  {vendor.phone && (
                    <span className="text-xs text-muted-foreground">
                      {vendor.phone}
                    </span>
                  )}
                  {!vendor.email && !vendor.phone && (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
              </td>

              {/* GSTIN */}
              <td className="px-4 py-3">
                {vendor.gstin ? (
                  <span className="font-mono text-xs bg-muted px-2 py-1 rounded-md text-foreground">
                    {vendor.gstin}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>

              {/* State */}
              <td className="px-4 py-3 text-muted-foreground">
                {vendor.state ?? "—"}
              </td>

              {/* Bills count */}
              <td className="px-4 py-3">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-xs font-semibold text-muted-foreground">
                  {vendor._count?.bills ?? 0}
                </span>
              </td>

              {/* Actions */}
              <td className="px-4 py-3 text-right">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-end">
                  <PermissionGate permission="vendor:delete">
                    <button
                      onClick={() => onDelete(vendor.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </PermissionGate>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
