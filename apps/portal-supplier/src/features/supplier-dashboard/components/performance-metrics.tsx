import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@registra/ui";

interface PerformanceMetric {
  label: string;
  value: string;
  helper: string;
}

interface PerformanceMetricsProps {
  items: PerformanceMetric[];
}

export function PerformanceMetrics({ items }: PerformanceMetricsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="border-border/70 bg-card/95 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="type-body">{item.label}</CardDescription>
            <p className="text-[1.5rem] font-semibold leading-8 tracking-[-0.02em] text-foreground">{item.value}</p>
          </CardHeader>
          <CardContent>
            <p className="type-body text-muted-foreground">{item.helper}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
