import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@registra/ui";

interface InsightsCardProps {
  items: string[];
}

export function InsightsCard({ items }: InsightsCardProps) {
  return (
    <Card className="border-primary/20 bg-primary/5 shadow-sm">
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle>Insights operacionais</CardTitle>
          <CardDescription>Leituras rápidas para antecipar gargalos e priorizar atuação do supplier.</CardDescription>
        </div>
        <Badge variant="secondary" className="w-fit">
          Inteligência
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item} className="rounded-2xl border border-primary/10 bg-background/80 px-4 py-3 text-sm text-foreground">
            {item}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
