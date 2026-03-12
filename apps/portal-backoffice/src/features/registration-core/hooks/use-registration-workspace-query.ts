import { useQuery } from "@tanstack/react-query";

import { fetchRegistrationWorkspaceMock } from "@/features/registration-core/api/registration-workspace-api";

export function useRegistrationWorkspaceQuery() {
  return useQuery({
    queryKey: ["registration", "workspace", "mock"],
    queryFn: () => fetchRegistrationWorkspaceMock(),
    staleTime: 30_000,
  });
}
