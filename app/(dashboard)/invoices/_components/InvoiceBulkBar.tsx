import { Trash2 } from "lucide-react";
import PermissionGate from "@/components/ui/PermissionGate";

interface Props {
  count: number;
  onClear: () => void;
  onDelete: () => void;
}

export default function InvoiceBulkBar({ count, onClear, onDelete }: Props) {
  if (count === 0) return null;
  return (
    <div className="flex items-center justify-between px-5 py-3 bg-primary/5 border border-primary/20 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="text-sm text-foreground">
        <span className="font-bold text-primary">{count}</span>{" "}
        invoice{count !== 1 ? "s" : ""} selected
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onClear}
          className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear selection
        </button>

        <PermissionGate permission="invoice:delete">
          <button
            onClick={onDelete}
            className="flex items-center gap-2 bg-background border border-destructive/30 text-destructive px-4 py-2 rounded-lg text-sm font-semibold hover:bg-destructive/10 hover:border-destructive/50 shadow-sm transition-all active:scale-[0.98]"
          >
            <Trash2 className="w-4 h-4" strokeWidth={2.5} />
            Delete {count}
          </button>
        </PermissionGate>
      </div>
    </div>
  );
}
