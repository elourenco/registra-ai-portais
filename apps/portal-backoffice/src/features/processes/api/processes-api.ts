import {
  toProcessDetail,
  toProcessListResult,
  resolveProcessDetailPath,
  resolveProcessesListPath,
} from "@/features/processes/core/process-response";
import type {
  AdvanceProcessResult,
  ProcessDetail,
  ProcessStageNote,
  ProcessListResult,
  ProcessListStatus,
  UpdateContractControlResult,
} from "@/features/processes/core/process-schema";
import {
  advanceProcessResultSchema,
  processStageNoteSchema,
  updateContractControlResultSchema,
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

export interface CreateProcessStageNoteParams {
  token: string;
  processId: string;
  stageId: string;
  note: string;
}

export async function createProcessStageNote({
  token,
  processId,
  stageId,
  note,
}: CreateProcessStageNoteParams): Promise<ProcessStageNote> {
  const response = await apiRequest<unknown>(
    `/api/v1/workflows/processes/${encodeURIComponent(processId)}/stages/${encodeURIComponent(stageId)}/notes`,
    {
      token,
      method: "POST",
      body: JSON.stringify({ note }),
    },
  );

  return processStageNoteSchema.parse(response);
}

export interface AdvanceProcessParams {
  token: string;
  processId: string;
  currentStageId: number;
  observation?: string | null;
}

export async function advanceProcess({
  token,
  processId,
  currentStageId,
  observation,
}: AdvanceProcessParams): Promise<AdvanceProcessResult> {
  const response = await apiRequest<unknown>(
    `/api/v1/workflows/processes/${encodeURIComponent(processId)}/advance`,
    {
      token,
      method: "POST",
      body: JSON.stringify({
        currentStageId,
        observation: observation?.trim() ? observation.trim() : null,
      }),
    },
  );

  return advanceProcessResultSchema.parse(response);
}

export interface UpdateProcessContractControlParams {
  token: string;
  processId: string;
  stageId: number;
  signatureUrl?: string | null;
  contractControlStatus: UpdateContractControlResult["contractControlStatus"];
}

export async function updateProcessContractControl({
  token,
  processId,
  stageId,
  signatureUrl,
  contractControlStatus,
}: UpdateProcessContractControlParams): Promise<UpdateContractControlResult> {
  const response = await apiRequest<unknown>(
    `/api/v1/workflows/processes/${encodeURIComponent(processId)}/contract-control`,
    {
      token,
      method: "PATCH",
      body: JSON.stringify({
        stageId,
        signatureUrl: signatureUrl?.trim() ? signatureUrl.trim() : null,
        contractControlStatus,
      }),
    },
  );

  return updateContractControlResultSchema.parse(response);
}
