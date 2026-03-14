import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/app/providers/auth-provider";
import { getSupplierDevelopmentContext } from "@/features/suppliers/api/suppliers-api";
import { retryWithoutUnauthorized } from "@/shared/api/query-retry";

export function useSupplierDevelopmentContextQuery(developmentId: string | null) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["suppliers", "development-context", session?.user.id, developmentId],
    queryFn: async () => {
      if (!session?.token || !developmentId) {
        throw new Error("Sessão inválida para carregar o contexto do empreendimento.");
      }

      return getSupplierDevelopmentContext({
        developmentId,
        token: session.token,
      });
    },
    enabled: Boolean(session?.token && developmentId),
    retry: retryWithoutUnauthorized,
  });
}
