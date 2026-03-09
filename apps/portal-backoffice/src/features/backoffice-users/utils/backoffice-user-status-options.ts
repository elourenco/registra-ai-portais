import type { BackofficeUserListStatusFilter } from "@registra/shared";

export const backofficeUserStatusOptions: Array<{
  label: string;
  value: BackofficeUserListStatusFilter;
}> = [
  { value: "all", label: "Todos os status" },
  { value: "active", label: "Ativo" },
  { value: "pending_onboarding", label: "Onboarding pendente" },
  { value: "suspended", label: "Suspenso" },
];
