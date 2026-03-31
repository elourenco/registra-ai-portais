import { useMemo } from "react";

import { KanbanCard } from "./kanban-card";
import { KanbanColumn } from "./kanban-column";
import type { KanbanBuyer, KanbanColumnMetrics, KanbanStage } from "./kanban-types";

const stageOrder: KanbanStage[] = ["certificado", "contrato", "registro"];

function getDaysStuck(lastUpdate: string) {
  const now = new Date();
  const then = new Date(lastUpdate);
  const diff = now.getTime() - then.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function getMetrics(items: KanbanBuyer[]): KanbanColumnMetrics {
  const total = items.length;
  const stuckCount = items.filter((item) => getDaysStuck(item.lastUpdate) > 3).length;
  const avgDays =
    total === 0 ? 0 : Math.round(items.reduce((sum, item) => sum + getDaysStuck(item.lastUpdate), 0) / total);

  return {
    total,
    stuckCount,
    stuckPercent: total === 0 ? 0 : Math.round((stuckCount / total) * 100),
    avgDays,
  };
}

type KanbanBoardProps = {
  buyers: KanbanBuyer[];
};

export function KanbanBoard({ buyers }: KanbanBoardProps) {
  const grouped = useMemo(
    () =>
      stageOrder.reduce(
        (acc, stage) => {
          acc[stage] = buyers.filter((buyer) => buyer.stage === stage);
          return acc;
        },
        {} as Record<KanbanStage, KanbanBuyer[]>,
      ),
    [buyers],
  );

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex min-w-max gap-6">
        {stageOrder.map((stage) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            buyers={grouped[stage]}
            metrics={getMetrics(grouped[stage])}
          />
        ))}
      </div>
    </div>
  );
}
