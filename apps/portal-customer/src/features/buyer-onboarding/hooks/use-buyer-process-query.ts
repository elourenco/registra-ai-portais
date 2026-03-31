import type { SessionData } from "@registra/shared";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/app/providers/auth-provider";

import { fetchBuyerProcess } from "../api/buyer-process-api";

export function getBuyerProcessQueryKey(session: SessionData | null) {
  return ["customer", "buyer-process", session?.user.id ?? "anonymous"];
}

export function getBuyerProcessQueryOptions(session: SessionData | null) {
  return {
    queryKey: getBuyerProcessQueryKey(session),
    enabled: Boolean(session?.token),
    retry: false,
    queryFn: () => fetchBuyerProcess(session!.token),
  };
}

export function useBuyerProcessQuery() {
  const { session } = useAuth();
  return useQuery(getBuyerProcessQueryOptions(session));
}
