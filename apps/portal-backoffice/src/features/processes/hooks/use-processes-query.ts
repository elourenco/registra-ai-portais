import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/app/providers/auth-provider";
import { listProcesses } from "@/features/processes/api/processes-api";
import type { ProcessListStatus } from "@/features/processes/core/process-schema";
import { retryWithoutUnauthorized } from "@/shared/api/query-retry";

interface UseProcessesQueryParams {
  page: number;
  limit: number;
  search?: string;
  supplierId?: string;
  status?: ProcessListStatus;
}

export function useProcessesQuery({ limit, page, search, supplierId, status }: UseProcessesQueryParams) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["processes", "list", session?.user.id, page, limit, search ?? null, supplierId ?? null, status ?? null],
    queryFn: async () => {
      if (!session?.token) {
        throw new Error("Sessão inválida para buscar processos.");
      }

      return listProcesses({
        token: session.token,
        page,
        limit,
        search,
        supplierId,
        status,
      });
    },
    enabled: Boolean(session?.token),
    retry: retryWithoutUnauthorized,
    staleTime: 30_000,
  });
}
