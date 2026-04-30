import type { WorkflowProcessDocumentStatus } from "@/features/processes/core/process-schema";
import { apiRequest } from "@/shared/api/http-client";
import { portalConfig } from "@/shared/config/portal-config";

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

export type PatchDocumentValidationStatusInput = {
  token: string;
  documentId: string;
  status: WorkflowProcessDocumentStatus;
  comments?: string;
};

export type UploadWorkflowDocumentInput = {
  token: string;
  processId: string;
  block: string;
  type: string;
  uploadedBy: string;
  status?: WorkflowProcessDocumentStatus;
  file: File;
};

export type UploadWorkflowDocumentResult = {
  documentId: string | null;
  status: WorkflowProcessDocumentStatus | null;
  raw: unknown;
};

export type PatchDocumentMetadataInput = {
  token: string;
  documentId: string;
  deedRegistrationNumber: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function pickText(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(Math.trunc(value));
    }
  }

  return null;
}

function normalizeWorkflowDocumentStatus(value: unknown): WorkflowProcessDocumentStatus | null {
  const normalized = pickText(value)?.toLowerCase();

  switch (normalized) {
    case "uploaded":
    case "under_review":
    case "approved":
    case "rejected":
    case "replaced":
      return normalized;
    default:
      return null;
  }
}

function normalizeUploadWorkflowDocumentResult(response: unknown): UploadWorkflowDocumentResult {
  const root = isRecord(response) ? response : {};
  const data = isRecord(root.data) ? root.data : null;
  const document = isRecord(root.document) ? root.document : null;
  const item = isRecord(root.item) ? root.item : null;
  const source = document ?? item ?? data ?? root;

  return {
    documentId: pickText(source.id, source.documentId),
    status: normalizeWorkflowDocumentStatus(source.status),
    raw: response,
  };
}

/**
 * `PATCH /api/v1/documents/{documentId}/status` (OpenAPI — Document).
 */
export async function patchDocumentValidationStatus({
  token,
  documentId,
  status,
  comments,
}: PatchDocumentValidationStatusInput): Promise<void> {
  await apiRequest<unknown>(`/api/v1/documents/${encodeURIComponent(documentId)}/status`, {
    token,
    method: "PATCH",
    body: JSON.stringify({
      status,
      ...(comments?.trim() ? { comments: comments.trim() } : {}),
    }),
  });
}

/**
 * `POST /api/v1/documents` (OpenAPI — Document).
 */
export async function uploadWorkflowDocument({
  token,
  processId,
  block,
  type,
  uploadedBy,
  status,
  file,
}: UploadWorkflowDocumentInput): Promise<UploadWorkflowDocumentResult> {
  const formData = new FormData();
  formData.set("processId", processId);
  formData.set("block", block);
  formData.set("type", type);
  formData.set("uploadedBy", uploadedBy);
  if (status) {
    formData.set("status", status);
  }
  formData.set("file", file);

  const response = await apiRequest<unknown>("/api/v1/documents", {
    token,
    method: "POST",
    body: formData,
  });

  return normalizeUploadWorkflowDocumentResult(response);
}

/**
 * `PATCH /api/v1/documents/{documentId}/metadata` (OpenAPI — Document).
 */
export async function patchDocumentMetadata({
  token,
  documentId,
  deedRegistrationNumber,
}: PatchDocumentMetadataInput): Promise<void> {
  await apiRequest<unknown>(`/api/v1/documents/${encodeURIComponent(documentId)}/metadata`, {
    token,
    method: "PATCH",
    body: JSON.stringify({ deedRegistrationNumber }),
  });
}

/**
 * `GET /api/v1/documents/{documentId}/download` (OpenAPI — Document).
 * Abre o ficheiro num novo separador (blob) com o token da sessão.
 */
export async function openDocumentInBrowser(params: {
  token: string;
  documentId: string;
}): Promise<void> {
  const url = `${apiBaseUrl}/api/v1/documents/${encodeURIComponent(params.documentId)}/download`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${params.token}`,
      Accept: "application/pdf,image/*,application/octet-stream,*/*",
      "x-portal": portalConfig.role,
    },
  });

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
