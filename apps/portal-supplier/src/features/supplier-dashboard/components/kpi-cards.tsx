import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@registra/ui";

interface KpiItem {
  label: string;
  value: string;
  delta?: string;
}

interface KpiCardsProps {
  items: KpiItem[];
}

export function KpiCards({ items }: KpiCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="border-border/70 bg-card/95 shadow-sm">
          <CardHeader className="space-y-3 pb-2">
            <CardDescription>{item.label}</CardDescription>
            <CardTitle className="text-3xl font-semibold tracking-tight">{item.value}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{item.delta ?? "Sem variação relevante no período."}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
