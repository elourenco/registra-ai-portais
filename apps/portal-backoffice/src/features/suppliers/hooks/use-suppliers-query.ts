import type { SupplierStatus } from "@registra/shared";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/app/providers/auth-provider";
import { listSuppliers } from "@/features/suppliers/api/suppliers-api";
import { retryWithoutUnauthorized } from "@/shared/api/query-retry";

interface UseSuppliersQueryFilters {
  cnpj?: string;
  name?: string;
  status?: SupplierStatus;
}

export function useSuppliersQuery(page: number, pageSize: number, filters?: UseSuppliersQueryFilters) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["suppliers", "list", session?.user.id, page, pageSize, filters?.name ?? null, filters?.cnpj ?? null, filters?.status ?? null],
    queryFn: async () => {
      if (!session?.token) {
        throw new Error("Sessão inválida para buscar fornecedores.");
      }

      return listSuppliers({
        cnpj: filters?.cnpj,
        name: filters?.name,
        status: filters?.status,
        token: session.token,
        page,
        limit: pageSize,
      });
    },
    enabled: Boolean(session?.token),
    retry: retryWithoutUnauthorized,
  });
}
