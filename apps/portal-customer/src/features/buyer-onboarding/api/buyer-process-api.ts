import {
  authenticatedBuyerProcessesResponseSchema,
  type AuthenticatedBuyerProcessesResponse,
  type BuyerProcessSnapshot,
} from "@registra/shared";

import { apiRequest } from "@/shared/api/http-client";

import { normalizeBuyerProcessResponse } from "../core/buyer-process-response";

export interface BuyerUpdatePayload {
  name?: string | null;
  cpf?: string | null;
  email?: string | null;
  phone?: string | null;
  basicDataConfirmed?: boolean | null;
  maritalStatus?: string | null;
  nationality?: string | null;
  profession?: string | null;
  birthDate?: string | null;
  hasEnotariadoCertificate?: boolean | null;
  spouseName?: string | null;
  spouseCpf?: string | null;
  spouseBirthDate?: string | null;
  spouseEmail?: string | null;
  spousePhone?: string | null;
}

export interface UploadBuyerDocumentPayload {
  processId: number;
  block: string;
  type: string;
  uploadedBy: string;
  file: File;
}

export async function fetchAuthenticatedBuyerProcesses(
  token: string,
): Promise<AuthenticatedBuyerProcessesResponse> {
  const response = await apiRequest<unknown>("/api/v1/buyers/process", {
    method: "GET",
    token,
  });

  return authenticatedBuyerProcessesResponseSchema.parse(response);
}

export async function fetchBuyerProcess(token: string): Promise<BuyerProcessSnapshot | null> {
  const response = await fetchAuthenticatedBuyerProcesses(token);
  return normalizeBuyerProcessResponse(response);
}

export async function updateBuyer(
  buyerId: string,
  payload: BuyerUpdatePayload,
  token: string,
): Promise<unknown> {
  return apiRequest<unknown>(`/api/v1/buyers/${buyerId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export async function uploadBuyerDocument(
  payload: UploadBuyerDocumentPayload,
  token: string,
): Promise<unknown> {
  const formData = new FormData();
  formData.set("processId", String(payload.processId));
  formData.set("block", payload.block);
  formData.set("type", payload.type);
  formData.set("uploadedBy", payload.uploadedBy);
  formData.set("file", payload.file);

  return apiRequest<unknown>("/api/v1/documents", {
    method: "POST",
    token,
    body: formData,
  });
}
