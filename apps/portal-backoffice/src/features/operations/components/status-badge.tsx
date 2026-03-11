import { Badge } from "@registra/ui";
import type {
  BillingStatus,
  DocumentStatus,
  ProcessStatus,
  RegistrationDevelopmentStatus,
  RegistrationBuyerStatus,
  RegistrationSupplierStatus,
  RequestStatus,
  RequirementStatus,
  TaskStatus,
  WorkflowBlockStatus,
} from "@registra/shared";

const toneMap = {
  success: "success",
  warning: "warning",
  danger: "danger",
  neutral: "secondary",
} as const;

type Tone = keyof typeof toneMap;

function resolveTone(status: string): Tone {
  const success = new Set([
    "active",
    "approved",
    "paid",
    "completed",
    "completed",
    "sent",
    "resolved",
    "registered",
    "signed",
  ]);
  const danger = new Set([
    "inactive",
    "blocked",
    "cancelled",
    "rejected",
    "overdue",
    "requirement_open",
    "resubmission_requested",
  ]);
  const warning = new Set([
    "onboarding",
    "launching",
    "pending_documents",
    "waiting_supplier",
    "waiting_registry_office",
    "pending",
    "created",
    "in_review",
    "responded",
    "in_progress",
    "in_resolution",
    "waiting_signature",
    "waiting_payment",
    "in_registry",
    "replaced",
  ]);

  if (success.has(status)) {
    return "success";
  }

  if (danger.has(status)) {
    return "danger";
  }

  if (warning.has(status)) {
    return "warning";
  }

  return "neutral";
}

interface StatusBadgeProps {
  status:
    | RegistrationSupplierStatus
    | RegistrationDevelopmentStatus
    | RegistrationBuyerStatus
    | ProcessStatus
    | WorkflowBlockStatus
    | RequestStatus
    | TaskStatus
    | DocumentStatus
    | RequirementStatus
    | BillingStatus;
  label: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return <Badge variant={toneMap[resolveTone(status)]}>{label}</Badge>;
}
