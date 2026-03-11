import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@registra/ui";
import type { ProcessHistoryEvent } from "@registra/shared";

import { formatDateTime } from "@/features/registration-core/core/registration-presenters";

export function HistoryTimeline({ items }: { items: ProcessHistoryEvent[] }) {
  return (
    <Card className="border-border/70 bg-card/90 shadow-sm">
      <CardHeader>
        <CardTitle>Histórico completo</CardTitle>
        <CardDescription>Alterações de etapa, validações, respostas e conclusão do processo.</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="space-y-4">
          {items.map((item) => (
            <li key={item.id} className="relative border-l border-border pl-4">
              <div className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-primary" />
              <p className="text-sm font-medium">{item.action}</p>
              <p className="text-sm text-muted-foreground">{item.note}</p>
              {item.comment ? <p className="mt-1 text-sm text-muted-foreground">{item.comment}</p> : null}
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDateTime(item.occurredAt)} · {item.user}
              </p>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
