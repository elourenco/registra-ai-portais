import { useQuery } from "@tanstack/react-query";

import { fetchOperationsWorkspace } from "@/features/operations/api/operations-api";

export function useOperationsWorkspaceQuery() {
  return useQuery({
    queryKey: ["operations", "workspace"],
    queryFn: () => fetchOperationsWorkspace(),
    staleTime: 30_000,
  });
}
