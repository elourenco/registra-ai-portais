import { Badge } from "@registra/ui";
import type { SupplierStatus } from "@registra/shared";

interface SupplierStatusBadgeProps {
  status: SupplierStatus;
}

function getStatusLabel(status: SupplierStatus): string {
  switch (status) {
    case "active":
      return "Ativo";
    case "draft":
      return "Rascunho";
    default:
      return status;
  }
}

function getStatusClassName(status: SupplierStatus): string {
  switch (status) {
    case "active":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700";
    case "draft":
      return "border-border bg-muted text-muted-foreground";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

export function SupplierStatusBadge({ status }: SupplierStatusBadgeProps) {
  return (
    <Badge variant="outline" className={getStatusClassName(status)}>
      {getStatusLabel(status)}
    </Badge>
  );
}
