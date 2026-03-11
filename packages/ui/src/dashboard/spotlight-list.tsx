import { AlertTriangle, ChevronRight, ShieldAlert } from "lucide-react";

import { Badge } from "../components/badge";
import { Button } from "../components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/card";
import type { SpotlightListProps } from "./types";

const toneToBadge = {
  neutral: "secondary",
  warning: "warning",
  danger: "danger",
} as const;

export function SpotlightList({ items }: SpotlightListProps) {
  return (
    <Card className="border-border/70 bg-card/80 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="h-4 w-4 text-primary" />
            Casos prioritários
          </CardTitle>
          <CardDescription>Processos que pedem acompanhamento próximo.</CardDescription>
        </div>
        <Button type="button" variant="ghost" size="sm" className="gap-1">
          Ver todos
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-xl border border-border/70 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <Badge variant={toneToBadge[item.priorityTone]} className="gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                {item.slaLabel}
              </Badge>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>Etapa atual</span>
              <span className="font-medium text-foreground">{item.stage}</span>
            </div>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}
