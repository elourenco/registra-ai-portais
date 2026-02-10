import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@registra/ui";

const mockSeries = [
  { day: "D1", value: 42 },
  { day: "D2", value: 60 },
  { day: "D3", value: 78 },
  { day: "D4", value: 55 },
  { day: "D5", value: 84 },
  { day: "D6", value: 96 },
  { day: "D7", value: 72 },
];

export function MockChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Status semanal</CardTitle>
        <CardDescription>Volume de processos atualizados por dia</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-48 items-end gap-3">
          {mockSeries.map((point) => (
            <div key={point.day} className="flex w-full flex-col items-center gap-2">
              <div
                className="w-full rounded-md bg-gradient-to-t from-primary/60 to-accent/70"
                style={{ height: `${point.value}%` }}
              />
              <span className="text-xs text-muted-foreground">{point.day}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
