import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@registra/ui";

interface ActivityItem {
  id: string;
  action: string;
  buyerName: string;
  timeLabel: string;
}

interface ActivityFeedProps {
  items: ActivityItem[];
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <Card className="border-border/70 bg-card/95 shadow-sm">
      <CardHeader>
        <CardTitle>Atividade recente</CardTitle>
        <CardDescription>Últimos eventos relevantes registrados na carteira do supplier.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item, index) => (
          <div key={item.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
              {index < items.length - 1 ? <span className="mt-2 h-full w-px bg-border" /> : null}
            </div>
            <div className="space-y-1 pb-4">
              <p className="text-sm font-medium text-foreground">
                {item.action} <span className="text-muted-foreground">• {item.buyerName}</span>
              </p>
              <p className="text-xs text-muted-foreground">{item.timeLabel}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
