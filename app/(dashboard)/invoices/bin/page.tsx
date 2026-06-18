"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Trash2, Inbox, AlertTriangle } from "lucide-react";
import { getUser } from "@/lib/auth";
import {
  fetchDeletedInvoices,
  restoreInvoice,
  permanentDeleteInvoice,
} from "@/lib/invoices";
import { useToast } from "@/components/ui/Toast";
import { LoadingState } from "@/components/ui/LoadingState";

const fmt = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2 });
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

type DeletedInvoice = {
  id: string;
  number: string | number;
  client: { name: string };
  total: number;
  deletedAt: string;
};

type ActionState = Record<string, "restoring" | "deleting" | undefined>;

function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={`inline-block rounded-full animate-spin border-2 shrink-0 ${className}`}
    />
  );
}

export default function RecycleBinPage() {
  const businessId = getUser()?.business?.id;
  const { confirm, success, error } = useToast();
  const [items, setItems] = useState<DeletedInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionState, setActionState] = useState<ActionState>({});

  useEffect(() => {
    let canceled = false;

    const fetchData = async () => {
      if (!businessId) {
        setLoading(false);
        return;
      }
      try {
        const data = await fetchDeletedInvoices(businessId);
        if (canceled) return;
        setItems(data);
      } catch {
        // show empty bin rather than frozen loading state
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    void fetchData();
    return () => {
      canceled = true;
    };
  }, [businessId]);

  const setAction = (id: string, state: "restoring" | "deleting" | undefined) =>
    setActionState((prev) => ({ ...prev, [id]: state }));

  const handleRestore = async (inv: DeletedInvoice) => {
    setAction(inv.id, "restoring");
    try {
      await restoreInvoice(inv.id);
      setItems((prev) => prev.filter((i) => i.id !== inv.id));
      success("Invoice restored", `#${inv.number} is back in your active list.`);
    } catch {
      error("Failed to restore", "Please try again.");
    } finally {
      setAction(inv.id, undefined);
    }
  };

  const handlePermanentDelete = async (inv: DeletedInvoice) => {
    const confirmed = await confirm({
      title: `Permanently delete #${inv.number}?`,
      message:
        "This cannot be undone. The invoice and all its payment records will be removed forever. The invoice number will remain a permanent gap in your sequence.",
      confirmText: "Delete forever",
      danger: true,
    });
    if (!confirmed) return;

    setAction(inv.id, "deleting");
    try {
      await permanentDeleteInvoice(inv.id);
      setItems((prev) => prev.filter((i) => i.id !== inv.id));
      success("Permanently deleted", `Invoice #${inv.number} has been removed.`);
    } catch {
      error("Failed to delete", "Please try again.");
    } finally {
      setAction(inv.id, undefined);
    }
  };

  if (loading) return <LoadingState page="invoices" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/invoices"
          className="flex items-center justify-center w-9 h-9 rounded-xl border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150 shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-foreground">Recycle Bin</h1>
            {items.length > 0 && (
              <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs font-semibold rounded-full">
                {items.length}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Deleted invoices · restore or permanently remove
          </p>
        </div>
      </div>

      {/* Warning banner */}
      {items.length > 0 && (
        <div className="flex items-start gap-3 px-4 py-3.5 bg-destructive/5 border border-destructive/15 rounded-2xl">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">
              Permanent deletion cannot be undone.
            </span>{" "}
            Restoring an invoice brings it back to your active list with all payment
            records intact.
          </p>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl flex flex-col items-center justify-center py-20 text-center px-6">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Inbox className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">The bin is empty</p>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-xs leading-relaxed">
            Deleted invoices appear here. You can restore or permanently remove them.
          </p>
          <Link
            href="/invoices"
            className="mt-6 inline-flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to invoices
          </Link>
        </div>
      ) : (
        /* Item list */
        <div className="space-y-2">
          {items.map((inv) => {
            const state = actionState[inv.id];
            const busy = !!state;

            return (
              <div
                key={inv.id}
                className={`bg-card border border-border rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 transition-opacity duration-200 ${
                  busy ? "opacity-60" : ""
                }`}
              >
                {/* Icon + invoice details */}
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-muted/70 flex items-center justify-center shrink-0">
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">#{inv.number}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {inv.client.name}
                    </p>
                  </div>
                </div>

                {/* Amount + deleted date */}
                <div className="flex items-center gap-6 shrink-0 pl-13 sm:pl-0">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Total
                    </p>
                    <p className="text-sm font-semibold text-foreground tabular-nums">
                      {fmt(inv.total)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Deleted
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {fmtDate(inv.deletedAt)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 pl-13 sm:pl-0">
                  <button
                    onClick={() => handleRestore(inv)}
                    disabled={busy}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-primary/5 border border-primary/20 text-primary text-xs font-semibold rounded-xl hover:bg-primary/10 transition-all duration-150 disabled:cursor-not-allowed"
                  >
                    {state === "restoring" ? (
                      <Spinner className="w-3.5 h-3.5 border-primary/25 border-t-primary" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5" />
                    )}
                    {state === "restoring" ? "Restoring…" : "Restore"}
                  </button>

                  <button
                    onClick={() => handlePermanentDelete(inv)}
                    disabled={busy}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-destructive/5 border border-destructive/20 text-destructive text-xs font-semibold rounded-xl hover:bg-destructive/10 transition-all duration-150 disabled:cursor-not-allowed"
                  >
                    {state === "deleting" ? (
                      <Spinner className="w-3.5 h-3.5 border-destructive/25 border-t-destructive" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    {state === "deleting" ? "Deleting…" : "Delete forever"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
