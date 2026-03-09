import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/app/providers/auth-provider";
import { listSuppliers } from "@/features/suppliers/api/suppliers-api";
import { retryWithoutUnauthorized } from "@/shared/api/query-retry";

export function useSuppliersQuery(page: number, pageSize: number) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["suppliers", "list", session?.user.id, page, pageSize],
    queryFn: async () => {
      if (!session?.token) {
        throw new Error("Sessão inválida para buscar fornecedores.");
      }

      return listSuppliers({
        token: session.token,
        page,
        limit: pageSize,
      });
    },
    enabled: Boolean(session?.token),
    retry: retryWithoutUnauthorized,
  });
}
