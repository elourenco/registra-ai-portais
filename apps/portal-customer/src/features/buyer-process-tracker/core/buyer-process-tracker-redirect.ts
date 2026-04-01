import type { AuthenticatedBuyerProcessesResponse } from "@registra/shared";

function normalizeStageName(value: string | null) {
  return value?.trim().toLocaleLowerCase("pt-BR") ?? null;
}

export function shouldRedirectToBuyerProcessTracker(
  response: AuthenticatedBuyerProcessesResponse,
) {
  return response.processes.some((process) => {
    const isCertificateStage =
      normalizeStageName(process.currentStageName) ===
      normalizeStageName("Emissão de Certificados");

    return isCertificateStage && process.currentStageDocumentSummary?.hasUploadedDocuments === true;
  });
}
