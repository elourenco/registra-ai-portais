import { Badge } from "@registra/ui";
import type { SupplierStatus } from "@registra/shared";

interface SupplierStatusBadgeProps {
  status: SupplierStatus;
}

function getStatusLabel(status: SupplierStatus): string {
  switch (status) {
    case "active":
      return "Ativo";
    case "pending_onboarding":
      return "Onboarding";
    case "suspended":
      return "Suspenso";
    case "draft":
      return "Rascunho";
    default:
      return status;
  }
}

function getStatusClassName(status: SupplierStatus): string {
  switch (status) {
    case "active":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "pending_onboarding":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "draft":
      return "border-slate-200 bg-slate-100 text-slate-700";
    case "suspended":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export function SupplierStatusBadge({ status }: SupplierStatusBadgeProps) {
  return (
    <Badge variant="outline" className={getStatusClassName(status)}>
      {getStatusLabel(status)}
    </Badge>
  );
}
