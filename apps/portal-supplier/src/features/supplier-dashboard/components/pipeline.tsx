import { Card, CardContent, CardDescription, CardHeader, CardTitle, cn } from "@registra/ui";

interface PipelineStage {
  name: string;
  count: number;
  percentage: number;
}

interface PipelineProps {
  stages: PipelineStage[];
}

const stageToneClassName = [
  "bg-sky-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-emerald-500",
];

export function Pipeline({ stages }: PipelineProps) {
  return (
    <Card className="border-border/70 bg-card/95 shadow-sm">
      <CardHeader>
        <CardTitle>Pipeline operacional</CardTitle>
        <CardDescription>Distribuição dos compradores ao longo das etapas do registro.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex h-3 overflow-hidden rounded-full bg-muted">
          {stages.map((stage, index) => (
            <div
              key={stage.name}
              className={cn(stageToneClassName[index] ?? "bg-primary")}
              style={{ width: `${stage.percentage}%` }}
            />
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stages.map((stage, index) => (
            <div key={stage.name} className="rounded-2xl border border-border/70 bg-background/60 p-4">
              <div className="flex items-center gap-2">
                <span className={cn("h-2.5 w-2.5 rounded-full", stageToneClassName[index] ?? "bg-primary")} />
                <p className="text-sm font-medium text-foreground">{stage.name}</p>
              </div>
              <div className="mt-4 flex items-end justify-between gap-3">
                <p className="text-3xl font-semibold tracking-tight">{stage.count}</p>
                <p className="text-sm text-muted-foreground">{stage.percentage}% do total</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
