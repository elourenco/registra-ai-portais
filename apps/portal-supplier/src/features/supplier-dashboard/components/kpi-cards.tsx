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
            <CardDescription className="type-body">{item.label}</CardDescription>
            <p className="text-[2rem] font-semibold leading-10 tracking-[-0.02em] text-foreground">{item.value}</p>
          </CardHeader>
          <CardContent>
            <p className="type-body text-muted-foreground">{item.delta ?? "Sem variação relevante no período."}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
