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
            <CardDescription>{item.label}</CardDescription>
            <CardTitle className="text-2xl font-semibold tracking-tight">{item.value}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{item.helper}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
