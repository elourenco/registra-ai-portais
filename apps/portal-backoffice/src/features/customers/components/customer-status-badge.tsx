import { Badge } from "@registra/ui";
import type { CustomerStatus } from "@registra/shared";

interface CustomerStatusBadgeProps {
  status: CustomerStatus;
}

const statusMap: Record<CustomerStatus, { label: string; className: string }> = {
  active: {
    label: "Ativo",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  pending_review: {
    label: "Em revisão",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  inactive: {
    label: "Inativo",
    className: "border-slate-200 bg-slate-100 text-slate-700",
  },
  blocked: {
    label: "Bloqueado",
    className: "border-rose-200 bg-rose-50 text-rose-700",
  },
};

export function CustomerStatusBadge({ status }: CustomerStatusBadgeProps) {
  const meta = statusMap[status];

  return (
    <Badge variant="outline" className={meta.className}>
      {meta.label}
    </Badge>
  );
}
