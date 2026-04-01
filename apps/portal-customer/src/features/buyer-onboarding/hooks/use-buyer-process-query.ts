import type { SessionData } from "@registra/shared";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/app/providers/auth-provider";

import { fetchBuyerProcess } from "../api/buyer-process-api";

interface BuyerProcessQueryOverrides {
  enabled?: boolean;
  refetchOnMount?: boolean | "always";
}

export function getBuyerProcessQueryKey(session: SessionData | null) {
  return ["customer", "buyer-process", session?.user.id ?? "anonymous"];
}

export function getBuyerProcessQueryOptions(
  session: SessionData | null,
  overrides: BuyerProcessQueryOverrides = {},
) {
  return {
    queryKey: getBuyerProcessQueryKey(session),
    enabled: Boolean(session?.token) && (overrides.enabled ?? true),
    retry: false,
    queryFn: () => fetchBuyerProcess(session!.token),
    refetchOnMount: overrides.refetchOnMount,
  };
}

export function useBuyerProcessQuery(overrides?: BuyerProcessQueryOverrides) {
  const { session } = useAuth();
  return useQuery(getBuyerProcessQueryOptions(session, overrides));
}
