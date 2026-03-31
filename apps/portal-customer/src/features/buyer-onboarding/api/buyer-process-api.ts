import type { BuyerProcessSnapshot } from "@registra/shared";

import { apiRequest } from "@/shared/api/http-client";

import { normalizeBuyerProcessResponse } from "../core/buyer-process-response";

export async function fetchBuyerProcess(token: string): Promise<BuyerProcessSnapshot | null> {
  const response = await apiRequest<unknown>("/api/v1/buyers/process", {
    method: "GET",
    token,
  });

  return normalizeBuyerProcessResponse(response);
}
