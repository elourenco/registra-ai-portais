import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@registra/ui";

interface AlertItem {
  id: string;
  buyerName: string;
  stage: string;
  stuckLabel: string;
  onViewProcess: () => void;
}

interface AlertsCardProps {
  items: AlertItem[];
}

export function AlertsCard({ items }: AlertsCardProps) {
  return (
    <Card className="border-border/70 bg-card/95 shadow-sm">
      <CardHeader>
        <CardTitle>Atenção necessária</CardTitle>
        <CardDescription>Compradores com maior risco operacional e necessidade de ação imediata.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhum alerta no momento
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-background/60 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{item.buyerName}</p>
                  <Badge variant="danger">Atrasado</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {item.stage} • parado {item.stuckLabel}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={item.onViewProcess}>
                Ver processo
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
