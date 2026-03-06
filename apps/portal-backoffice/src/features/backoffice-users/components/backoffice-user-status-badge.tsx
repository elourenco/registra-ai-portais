import { Badge } from "@registra/ui";
import type { BackofficeUserStatus } from "@registra/shared";

interface BackofficeUserStatusBadgeProps {
  status: BackofficeUserStatus;
}

const statusMap: Record<
  BackofficeUserStatus,
  {
    className: string;
    label: string;
  }
> = {
  active: {
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    label: "Ativo",
  },
  pending_onboarding: {
    className: "border-amber-200 bg-amber-50 text-amber-700",
    label: "Onboarding pendente",
  },
  suspended: {
    className: "border-rose-200 bg-rose-50 text-rose-700",
    label: "Suspenso",
  },
};

export function BackofficeUserStatusBadge({ status }: BackofficeUserStatusBadgeProps) {
  const config = statusMap[status];

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
