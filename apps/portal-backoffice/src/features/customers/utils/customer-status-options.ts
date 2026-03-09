import type { CustomerListStatusFilter } from "@registra/shared";

export const customerStatusOptions: Array<{
  label: string;
  value: CustomerListStatusFilter;
}> = [
  { value: "all", label: "Todos os status" },
  { value: "active", label: "Ativo" },
  { value: "pending_review", label: "Em revisão" },
  { value: "inactive", label: "Inativo" },
  { value: "blocked", label: "Bloqueado" },
];
