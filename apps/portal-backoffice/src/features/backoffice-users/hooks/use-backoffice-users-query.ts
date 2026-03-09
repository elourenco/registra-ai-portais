import { useQuery } from "@tanstack/react-query";
import type { BackofficeUserListFilters } from "@registra/shared";

import { useAuth } from "@/app/providers/auth-provider";
import { listBackofficeUsers } from "@/features/backoffice-users/api/backoffice-users-api";
import { retryWithoutUnauthorized } from "@/shared/api/query-retry";

export const backofficeUsersQueryKey = ["backoffice-users", "list"] as const;

export function useBackofficeUsersQuery(filters: BackofficeUserListFilters) {
  const { session } = useAuth();

  return useQuery({
    queryKey: [...backofficeUsersQueryKey, session?.user.id, filters],
    queryFn: async () => {
      if (!session?.token) {
        throw new Error("Sessão inválida para buscar usuários do backoffice.");
      }

      return listBackofficeUsers({
        token: session.token,
        filters,
      });
    },
    enabled: Boolean(session?.token),
    retry: retryWithoutUnauthorized,
  });
}
