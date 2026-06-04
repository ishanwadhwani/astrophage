export function EmptyCell({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground/40 text-xs">
      <span className="w-3 border-t border-dashed border-muted-foreground/30" />
      {label && <span className="text-muted-foreground/50">{label}</span>}
    </span>
  );
}
