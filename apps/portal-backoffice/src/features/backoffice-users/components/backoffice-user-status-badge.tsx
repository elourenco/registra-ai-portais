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
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
    label: "Ativo",
  },
  pending_onboarding: {
    className: "border-amber-500/20 bg-amber-500/10 text-amber-700",
    label: "Onboarding pendente",
  },
  suspended: {
    className: "border-destructive/20 bg-destructive/10 text-destructive",
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
