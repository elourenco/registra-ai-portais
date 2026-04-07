import type { BuyerProcessSnapshot, BuyerProcessDocument } from "@registra/shared";

export type BuyerProcessTrackerStatus = "in_progress" | "in_review" | "waiting_user" | "completed";
export type BuyerProcessTrackerStageStatus = "pending" | "in_progress" | "completed";

export interface BuyerProcessTrackerTimelineStage {
  id: string;
  title: string;
  status: BuyerProcessTrackerStageStatus;
  description: string;
}

export interface BuyerProcessTrackerViewModel {
  processId: string | null;
  status: BuyerProcessTrackerStatus;
  timeline: BuyerProcessTrackerTimelineStage[];
  documents: BuyerProcessDocument[];
  pendingAction: boolean;
}

export const defaultBuyerProcessTrackerViewModel: BuyerProcessTrackerViewModel = {
  status: "in_progress",
  timeline: [
    {
      id: "certificate",
      title: "Certificado",
      status: "in_progress",
      description: "Acompanhando o envio e a validação dos documentos.",
    },
    {
      id: "contract",
      title: "Contrato",
      status: "pending",
      description: "Será iniciado após a etapa de certificado.",
    },
    {
      id: "registry",
      title: "Registro",
      status: "pending",
      description: "Última etapa do processo.",
    },
  ],
  documents: [],
  processId: null,
  pendingAction: false,
};

export function createBuyerProcessTrackerViewModel(
  snapshot: BuyerProcessSnapshot | null | undefined,
  fallback: BuyerProcessTrackerViewModel,
): BuyerProcessTrackerViewModel {
  if (!snapshot) {
    return fallback;
  }

  const timeline =
    snapshot.timeline.length > 0
      ? snapshot.timeline.map((stage) => ({
          id: stage.id,
          title: stage.title,
          status: stage.status,
          description: stage.description,
        }))
      : fallback.timeline;

  return {
    status: snapshot.trackerStatus,
    timeline,
    processId: snapshot.processId,
    documents: snapshot.documents,
    pendingAction: snapshot.documents.some((document) => document.status === "rejected"),
  };
}
