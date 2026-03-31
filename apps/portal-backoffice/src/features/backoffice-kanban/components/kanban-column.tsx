import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@registra/ui";

import { KanbanCard } from "./kanban-card";
import type { KanbanBuyer, KanbanColumnMetrics, KanbanStage } from "./kanban-types";

const stageLabels: Record<KanbanStage, string> = {
  certificado: "Certificado",
  contrato: "Contrato",
  registro: "Registro",
};

type KanbanColumnProps = {
  stage: KanbanStage;
  buyers: KanbanBuyer[];
  metrics: KanbanColumnMetrics;
};

export function KanbanColumn({ stage, buyers, metrics }: KanbanColumnProps) {
  return (
    <div className="flex min-w-[320px] max-w-[380px] flex-1 flex-col gap-4">
      <Card className="border-border/70 bg-card shadow-sm">
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-lg">{stageLabels[stage]}</CardTitle>
              <CardDescription>{metrics.total} processo(s) nesta etapa</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {buyers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-5 text-sm text-muted-foreground">
              Nenhum processo nesta etapa
            </div>
          ) : (
            buyers.map((buyer) => <KanbanCard key={buyer.id} buyer={buyer} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}
