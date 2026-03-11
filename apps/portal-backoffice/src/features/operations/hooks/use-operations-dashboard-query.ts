import { useQuery } from "@tanstack/react-query";

import { fetchOperationsDashboard } from "@/features/operations/api/operations-api";

export function useOperationsDashboardQuery() {
  return useQuery({
    queryKey: ["operations", "dashboard"],
    queryFn: () => fetchOperationsDashboard(),
    staleTime: 30_000,
  });
}
