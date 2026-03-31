import { Badge, Card, CardContent, Input, Select } from "@registra/ui";
import { Search } from "lucide-react";

type FiltersBarProps = {
  search: string;
  empreendimento: string;
  status: string;
  total: number;
  empreendimentoOptions: string[];
  onSearchChange: (value: string) => void;
  onEmpreendimentoChange: (value: string) => void;
  onStatusChange: (value: string) => void;
};

export function FiltersBar({
  search,
  empreendimento,
  status,
  total,
  empreendimentoOptions,
  onSearchChange,
  onEmpreendimentoChange,
  onStatusChange,
}: FiltersBarProps) {
  return (
    <Card className="border-border/70 bg-card shadow-sm">
      <CardContent className="space-y-4 p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_220px_220px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.currentTarget.value)}
              placeholder="Buscar comprador"
              className="pl-9"
            />
          </div>

          <Select
            value={empreendimento}
            onChange={(event) => onEmpreendimentoChange(event.currentTarget.value)}
          >
            <option value="all">Todos os empreendimentos</option>
            {empreendimentoOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>

          <Select value={status} onChange={(event) => onStatusChange(event.currentTarget.value)}>
            <option value="all">Todos os status</option>
            <option value="pending">Aguardando documentos</option>
            <option value="in_analysis">Em análise</option>
            <option value="approved">Aprovado</option>
            <option value="rejected">Rejeitado</option>
          </Select>

          <div className="flex items-center justify-end">
            <Badge variant="outline">{total} processo(s)</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
