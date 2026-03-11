import type { SupplierProcessListItem, SupplierStatus } from "@registra/shared";

export function mapProcessStatusToSupplierStatus(
  status: SupplierProcessListItem["status"],
): SupplierStatus {
  switch (status) {
    case "completed":
      return "active";
    case "in_progress":
    case "cancelled":
      return "draft";
    default:
      return "draft";
  }
}

export function getSupplierProcessStatusLabel(status: SupplierProcessListItem["status"]): string {
  switch (status) {
    case "in_progress":
      return "Em andamento";
    case "completed":
      return "Concluído";
    case "cancelled":
      return "Cancelado";
    default:
      return status;
  }
}
