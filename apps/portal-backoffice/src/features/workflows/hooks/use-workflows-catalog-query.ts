import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/app/providers/auth-provider";
import { listWorkflows } from "@/features/workflows/api/workflows-api";
import { retryWithoutUnauthorized } from "@/shared/api/query-retry";

export const workflowsCatalogQueryKey = ["workflows", "catalog"] as const;

export function useWorkflowsCatalogQuery() {
  const { session } = useAuth();

  return useQuery({
    queryKey: [...workflowsCatalogQueryKey, session?.user.id],
    queryFn: async () => {
      if (!session?.token) {
        throw new Error("Sessão inválida para listar workflows.");
      }

      return listWorkflows({ token: session.token });
    },
    enabled: Boolean(session?.token),
    retry: retryWithoutUnauthorized,
  });
}
