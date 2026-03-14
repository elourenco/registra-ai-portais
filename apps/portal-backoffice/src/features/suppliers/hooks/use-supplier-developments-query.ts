import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/app/providers/auth-provider";
import { listSupplierDevelopments } from "@/features/suppliers/api/suppliers-api";
import { retryWithoutUnauthorized } from "@/shared/api/query-retry";

export function useSupplierDevelopmentsQuery(supplierId: string | null) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["suppliers", "developments", session?.user.id, supplierId],
    queryFn: async () => {
      if (!session?.token || !supplierId) {
        throw new Error("Sessão inválida para carregar empreendimentos do supplier.");
      }

      return listSupplierDevelopments({
        supplierId,
        token: session.token,
      });
    },
    enabled: Boolean(session?.token && supplierId),
    retry: retryWithoutUnauthorized,
  });
}
