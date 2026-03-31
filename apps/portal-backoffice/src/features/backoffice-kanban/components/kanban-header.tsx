import { Badge, Card, CardContent } from "@registra/ui";

type KanbanHeaderProps = {
  total: number;
  blockedCount: number;
  delayedCount: number;
  averageStageTime: number;
};

export function KanbanHeader({
  total,
  blockedCount,
  delayedCount,
  averageStageTime,
}: KanbanHeaderProps) {
  return (
    <Card className="border-border/70 bg-card shadow-sm">
      <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Controle operacional por etapa</p>
          <p className="text-sm text-muted-foreground">
            {blockedCount} processos dependem de ação imediata e {delayedCount} estão parados acima
            do SLA.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{total} ativos</Badge>
          <Badge variant="warning">{blockedCount} exigem ação</Badge>
          <Badge variant="danger">{delayedCount} atrasados</Badge>
          <Badge variant="secondary">{averageStageTime}d média por etapa</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
