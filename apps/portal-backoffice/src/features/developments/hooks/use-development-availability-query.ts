import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/app/providers/auth-provider";
import { getDevelopmentAvailability } from "@/features/developments/api/development-availability-api";
import { retryWithoutUnauthorized } from "@/shared/api/query-retry";

export function useDevelopmentAvailabilityQuery(developmentId: string | null) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["backoffice", "developments", "availability", developmentId],
    queryFn: async () => {
      if (!session?.token || !developmentId) {
        throw new Error("Sessão inválida para consultar a disponibilidade do empreendimento.");
      }

      return getDevelopmentAvailability({
        developmentId,
        token: session.token,
      });
    },
    enabled: Boolean(session?.token && developmentId),
    retry: retryWithoutUnauthorized,
  });
}
