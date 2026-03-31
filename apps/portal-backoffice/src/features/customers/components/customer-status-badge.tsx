import { Badge } from "@registra/ui";
import type { CustomerStatus } from "@registra/shared";

interface CustomerStatusBadgeProps {
  status: CustomerStatus;
}

const statusMap: Record<CustomerStatus, { label: string; className: string }> = {
  active: {
    label: "Ativo",
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
  },
  pending_review: {
    label: "Em revisão",
    className: "border-amber-500/20 bg-amber-500/10 text-amber-700",
  },
  inactive: {
    label: "Inativo",
    className: "border-border bg-muted text-muted-foreground",
  },
  blocked: {
    label: "Bloqueado",
    className: "border-destructive/20 bg-destructive/10 text-destructive",
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
