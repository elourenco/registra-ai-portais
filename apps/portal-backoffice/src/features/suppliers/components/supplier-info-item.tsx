interface SupplierInfoItemProps {
  label: string;
  value: string | null;
}

export function SupplierInfoItem({ label, value }: SupplierInfoItemProps) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/60 px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-foreground">{value || "-"}</p>
    </div>
  );
}
