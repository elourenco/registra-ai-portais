import { BellRing, CheckCircle2, Clock3, MessageSquareText } from "lucide-react";

import { Badge } from "../components/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/card";
import type { ActivityFeedCardProps } from "./types";

const toneConfig = {
  info: {
    badge: "secondary",
    icon: MessageSquareText,
    label: "Atualização",
  },
  success: {
    badge: "success",
    icon: CheckCircle2,
    label: "Concluído",
  },
  warning: {
    badge: "warning",
    icon: BellRing,
    label: "Atenção",
  },
} as const;

function formatRelativeTime(value: string): string {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 1000 / 60));

  if (diffMinutes < 60) {
    return `há ${diffMinutes} min`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  return `há ${diffHours} h`;
}

export function ActivityFeedCard({ activities }: ActivityFeedCardProps) {
  return (
    <Card className="border-border/70 bg-card/80 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock3 className="h-4 w-4 text-primary" />
          Atividade recente
        </CardTitle>
        <CardDescription>Eventos mais recentes do fluxo operacional.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => {
          const config = toneConfig[activity.tone];
          const Icon = config.icon;

          return (
            <div key={activity.id} className="flex gap-3 rounded-xl border border-border/70 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <Badge variant={config.badge}>{config.label}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
                <p className="text-xs text-muted-foreground">{formatRelativeTime(activity.timestamp)}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
