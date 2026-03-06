import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/app/providers/auth-provider";
import { listSupplierProcesses } from "@/features/suppliers/api/suppliers-api";
import { retryWithoutUnauthorized } from "@/shared/api/query-retry";

export function useSupplierProcessesQuery(
  supplierId: string | null,
  page: number,
  pageSize: number,
) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["suppliers", "processes", session?.user.id, supplierId, page, pageSize],
    queryFn: async () => {
      if (!session?.token || !supplierId) {
        throw new Error("Sessão inválida para carregar processos do supplier.");
      }

      return listSupplierProcesses({
        token: session.token,
        supplierId,
        page,
        limit: pageSize,
      });
    },
    enabled: Boolean(session?.token && supplierId),
    retry: retryWithoutUnauthorized,
  });
}
