import type { WorkflowProcessDocumentStatus } from "@/features/processes/core/process-schema";
import { apiRequest } from "@/shared/api/http-client";

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
