import type { SupplierProcessListItem, SupplierStatus } from "@registra/shared";

export function mapProcessStatusToSupplierStatus(
  status: SupplierProcessListItem["status"],
): SupplierStatus {
  switch (status) {
    case "completed":
      return "active";
    case "in_progress":
      return "pending_onboarding";
    case "blocked":
    case "cancelled":
      return "suspended";
    case "created":
    default:
      return "draft";
  }
}

export function getSupplierProcessStatusLabel(status: SupplierProcessListItem["status"]): string {
  switch (status) {
    case "created":
      return "Criado";
    case "in_progress":
      return "Em andamento";
    case "completed":
      return "Concluído";
    case "blocked":
      return "Bloqueado";
    case "cancelled":
      return "Cancelado";
    default:
      return status;
  }
}
