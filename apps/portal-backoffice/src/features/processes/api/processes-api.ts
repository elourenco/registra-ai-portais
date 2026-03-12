import {
  toProcessDetail,
  toProcessListResult,
  resolveProcessDetailPath,
  resolveProcessesListPath,
} from "@/features/processes/core/process-response";
import type {
  ProcessDetail,
  ProcessListResult,
  ProcessListStatus,
} from "@/features/processes/core/process-schema";
import { apiRequest } from "@/shared/api/http-client";

export interface ListProcessesParams {
  token: string;
  page: number;
  limit: number;
  search?: string;
  supplierId?: string;
  status?: ProcessListStatus;
}

export async function listProcesses({
  token,
  page,
  limit,
  search,
  supplierId,
  status,
}: ListProcessesParams): Promise<ProcessListResult> {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(page));
  searchParams.set("limit", String(limit));

  if (search) {
    searchParams.set("search", search);
  }

  const basePath = resolveProcessesListPath(supplierId, status);
  const separator = basePath.includes("?") ? "&" : "?";
  const response = await apiRequest<unknown>(`${basePath}${separator}${searchParams.toString()}`, {
    token,
    method: "GET",
  });

  return toProcessListResult(response, page, limit);
}

export interface GetProcessDetailParams {
  token: string;
  processId: string;
  supplierId?: string;
}

export async function getProcessDetail({
  token,
  processId,
  supplierId,
}: GetProcessDetailParams): Promise<ProcessDetail> {
  const response = await apiRequest<unknown>(resolveProcessDetailPath(processId, supplierId), {
    token,
    method: "GET",
  });

  return toProcessDetail(response);
}
