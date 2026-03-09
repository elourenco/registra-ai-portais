import type { CustomerListFilters } from "@registra/shared";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/app/providers/auth-provider";
import { listCustomers } from "@/features/customers/api/customers-api";
import { retryWithoutUnauthorized } from "@/shared/api/query-retry";

export function useCustomersQuery(filters: CustomerListFilters) {
  const { session } = useAuth();

  return useQuery({
    queryKey: [
      "customers",
      "list",
      session?.user.id,
      filters.page,
      filters.limit,
      filters.search,
      filters.status,
    ],
    queryFn: async () => {
      if (!session?.token) {
        throw new Error("Sessão inválida para listar customers.");
      }

      return listCustomers({
        token: session.token,
        filters,
      });
    },
    enabled: Boolean(session?.token),
    retry: retryWithoutUnauthorized,
  });
}
