import {
  type AuthenticatedBuyerProcessesResponse,
  authenticatedBuyerProcessesResponseSchema,
  type BuyerProcessSnapshot,
} from "@registra/shared";

import { apiRequest } from "@/shared/api/http-client";
import { portalConfig } from "@/shared/config/portal-config";

import { normalizeBuyerProcessResponse } from "../core/buyer-process-response";

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

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

export async function openBuyerDocumentInBrowser(params: {
  token: string;
  documentId: string;
}): Promise<void> {
  const response = await fetch(
    `${apiBaseUrl}/api/v1/documents/${encodeURIComponent(params.documentId)}/download`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${params.token}`,
        Accept: "application/pdf,image/*,application/octet-stream,*/*",
        "x-portal": portalConfig.role,
      },
    },
  );

  if (!response.ok) {
    const message =
      response.status === 404
        ? "Documento não encontrado."
        : "Não foi possível carregar o documento.";
    throw new Error(message);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const newWindow = window.open(objectUrl, "_blank", "noopener,noreferrer");

  if (!newWindow) {
    URL.revokeObjectURL(objectUrl);
    throw new Error("Permita pop-ups para visualizar o documento.");
  }

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 120_000);
}
