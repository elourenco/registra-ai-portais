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
