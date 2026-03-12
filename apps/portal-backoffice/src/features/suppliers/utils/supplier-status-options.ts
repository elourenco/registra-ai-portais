import type { SupplierStatus } from "@registra/shared";

export type SupplierStatusFilterOption = SupplierStatus | "all";

interface SupplierStatusOption {
  label: string;
  value: SupplierStatusFilterOption;
}

export const supplierStatusOptions: SupplierStatusOption[] = [
  { value: "all", label: "Todos os status" },
  { value: "active", label: "Ativo" },
  { value: "draft", label: "Rascunho" },
];
