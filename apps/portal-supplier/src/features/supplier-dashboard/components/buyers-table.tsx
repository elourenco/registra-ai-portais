import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  SearchIcon,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@registra/ui";
import { useMemo, useState } from "react";

type BuyerStatus = "Em andamento" | "Aguardando comprador" | "Em análise" | "Atrasado" | "Concluído";

interface BuyerTableItem {
  id: string;
  name: string;
  empreendimento: string;
  stage: string;
  status: BuyerStatus;
  stuckDays: number;
  responsible: string;
  developmentId: string;
  buyerId: string;
  processId: string;
}

interface BuyersTableProps {
  items: BuyerTableItem[];
  empreendimentoOptions: string[];
  onViewProcess: (item: BuyerTableItem) => void;
  onViewDetails: (item: BuyerTableItem) => void;
}

const statusVariantMap: Record<BuyerStatus, "outline" | "warning" | "danger" | "secondary"> = {
  "Em andamento": "outline",
  "Aguardando comprador": "warning",
  "Em análise": "secondary",
  Atrasado: "danger",
  Concluído: "secondary",
};

const statusClassNameMap: Record<BuyerStatus, string> = {
  "Em andamento": "border-slate-200 bg-slate-100 text-slate-700",
  "Aguardando comprador": "",
  "Em análise": "border-sky-200 bg-sky-100 text-sky-700",
  Atrasado: "",
  Concluído: "border-emerald-200 bg-emerald-100 text-emerald-700",
};

function formatStuckDays(days: number) {
  if (days <= 0) {
    return "Hoje";
  }

  if (days === 1) {
    return "1 dia";
  }

  return `${days} dias`;
}

export function BuyersTable({
  items,
  empreendimentoOptions,
  onViewProcess,
  onViewDetails,
}: BuyersTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [empreendimentoFilter, setEmpreendimentoFilter] = useState<string>("all");
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc");

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...items]
      .filter((item) => {
        if (statusFilter !== "all" && item.status !== statusFilter) {
          return false;
        }

        if (empreendimentoFilter !== "all" && item.empreendimento !== empreendimentoFilter) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        return [item.name, item.empreendimento, item.stage, item.status, item.responsible]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      })
      .sort((left, right) =>
        sortDirection === "desc" ? right.stuckDays - left.stuckDays : left.stuckDays - right.stuckDays,
      );
  }, [empreendimentoFilter, items, search, sortDirection, statusFilter]);

  return (
    <Card className="border-border/70 bg-card/95 shadow-sm">
      <CardHeader className="gap-4">
        <div className="space-y-1">
          <CardTitle>Compradores monitorados</CardTitle>
          <CardDescription>Visão operacional detalhada dos compradores em andamento na carteira.</CardDescription>
        </div>

        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              placeholder="Buscar comprador, etapa ou responsável"
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.currentTarget.value)}>
            <option value="all">Todos status</option>
            <option value="Em andamento">Em andamento</option>
            <option value="Aguardando comprador">Aguardando comprador</option>
            <option value="Em análise">Em análise</option>
            <option value="Atrasado">Atrasado</option>
            <option value="Concluído">Concluído</option>
          </Select>

          <Select
            value={empreendimentoFilter}
            onChange={(event) => setEmpreendimentoFilter(event.currentTarget.value)}
          >
            <option value="all">Todos empreendimentos</option>
            {empreendimentoOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>

          <Button
            variant="outline"
            onClick={() => setSortDirection((current) => (current === "desc" ? "asc" : "desc"))}
          >
            Tempo parado: {sortDirection === "desc" ? "maior" : "menor"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {filteredItems.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">Nenhum comprador encontrado</div>
        ) : (
          <div className="overflow-hidden rounded-b-xl border-t border-border/70">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Empreendimento</TableHead>
                  <TableHead>Etapa atual</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tempo parado</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id} className="transition-colors hover:bg-muted/40">
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.empreendimento}</TableCell>
                    <TableCell>{item.stage}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariantMap[item.status]} className={statusClassNameMap[item.status]}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatStuckDays(item.stuckDays)}</TableCell>
                    <TableCell>{item.responsible}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Ações
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onViewProcess(item)}>Ver processo</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onViewDetails(item)}>Ver detalhes</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
