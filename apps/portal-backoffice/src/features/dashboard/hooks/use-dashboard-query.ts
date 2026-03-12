import { useQuery } from "@tanstack/react-query";

import { fetchRegistrationDashboardMock } from "@/features/registration-core/api/registration-workspace-api";

export function useDashboardQuery() {
  return useQuery({
    queryKey: ["dashboard", "registration", "mock"],
    queryFn: () => fetchRegistrationDashboardMock(),
    staleTime: 30_000,
  });
}
