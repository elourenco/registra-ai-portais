import { availabilityStatusLabels, type AvailabilityItem } from "@registra/shared";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@registra/ui";
import { useMemo } from "react";

interface DevelopmentAvailabilityBuyer {
  id: string;
  name: string;
  unitLabel?: string | null;
}

interface DevelopmentAvailabilityOverviewProps {
  buyers: DevelopmentAvailabilityBuyer[];
  items: AvailabilityItem[];
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function DevelopmentAvailabilityOverview({
  buyers,
  items,
}: DevelopmentAvailabilityOverviewProps) {
  const derived = useMemo(() => {
    const buyersById = new Map(buyers.map((buyer) => [buyer.id, buyer]));
    const missing = buyers.filter((buyer) => !buyer.unitLabel?.trim());
    const assignedItems = items.filter((item) => item.buyerId);
    const duplicateUnits = assignedItems.filter(
      (item, index, collection) =>
        collection.findIndex((candidate) => candidate.displayLabel === item.displayLabel) !== index,
    );

    return {
      totalCount: items.length,
      occupiedCount: assignedItems.length,
      blockedCount: items.filter((item) => item.status === "blocked").length,
      missingCount: missing.length,
      duplicateCount: new Set(duplicateUnits.map((item) => item.displayLabel)).size,
      buyersById,
    };
  }, [buyers, items]);

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">Disponibilidade operacional</h2>
        <p className="text-sm text-muted-foreground">
          Leitura da volumetria real do empreendimento conforme a API operacional.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <SummaryCard label="Total de itens" value={derived.totalCount} />
        <SummaryCard label="Itens ocupados" value={derived.occupiedCount} />
        <SummaryCard label="Itens bloqueados" value={derived.blockedCount} />
        <SummaryCard label="Compradores sem unidade" value={derived.missingCount} />
        <SummaryCard label="Conflitos" value={derived.duplicateCount} />
      </div>

      {items.length === 0 ? (
        <Card className="border-border/70 bg-card/95 shadow-sm">
          <CardHeader>
            <CardTitle>Sem volumetria cadastrada</CardTitle>
            <CardDescription>
              A API ainda não retornou itens de disponibilidade para este empreendimento.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card className="border-border/70 bg-card/95 shadow-sm">
          <CardHeader>
            <CardTitle>Itens de volumetria</CardTitle>
            <CardDescription>
              Use esta visão para validar status, vínculos com compradores e bloqueios operacionais.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-2xl border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Identificador</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Comprador vinculado</TableHead>
                    <TableHead>Motivo de bloqueio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.displayLabel}</TableCell>
                      <TableCell>{availabilityStatusLabels[item.status]}</TableCell>
                      <TableCell>
                        {item.buyerId
                          ? derived.buyersById.get(item.buyerId)?.name ?? `Comprador ${item.buyerId}`
                          : "-"}
                      </TableCell>
                      <TableCell>{item.blockedReason ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
