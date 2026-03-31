export type KanbanStage = "certificado" | "contrato" | "registro";
export type KanbanStatus = "pending" | "in_analysis" | "approved" | "rejected";

export type KanbanBuyer = {
  id: string;
  buyerId: string;
  processId: string;
  supplierId: string;
  developmentId: string;
  name: string;
  empreendimento: string;
  stage: KanbanStage;
  status: KanbanStatus;
  lastUpdate: string;
  responsible: string;
};

export type KanbanColumnMetrics = {
  total: number;
  stuckCount: number;
  stuckPercent: number;
  avgDays: number;
};
