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

export interface UpdateProcessParams {
  token: string;
  supplierId: string;
  processId: string;
  status: "completed" | "cancelled";
}

export async function updateSupplierProcess({
  token,
  supplierId,
  processId,
  status,
}: UpdateProcessParams): Promise<ProcessDetail> {
  const response = await apiRequest<unknown>(
    resolveProcessDetailPath(processId, supplierId),
    {
      token,
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
  );

  return toProcessDetail(response);
}

export interface CreateSupplierProcessParams {
  token: string;
  supplierId: string;
  name: string;
  workflowId: number;
}

export async function createSupplierProcess({
  token,
  supplierId,
  name,
  workflowId,
}: CreateSupplierProcessParams): Promise<ProcessDetail> {
  const response = await apiRequest<unknown>(
    `/api/v1/workflows/suppliers/${encodeURIComponent(supplierId)}/processes`,
    {
      token,
      method: "POST",
      body: JSON.stringify({
        name,
        workflowId,
      }),
    },
  );

  return toProcessDetail(response);
}
