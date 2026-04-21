import { Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@registra/ui";

import type { ProcessListItem } from "@/features/processes/core/process-schema";
import { formatDateTime } from "@/shared/utils/format-date-time";

interface ProcessesTableProps {
  items: ProcessListItem[];
  onViewProcess: (process: ProcessListItem) => void;
}

export function ProcessesTable({ items, onViewProcess }: ProcessesTableProps) {
  const statusVariantMap = {
    in_progress: "secondary",
    completed: "success",
    cancelled: "danger",
    waiting_supplier: "warning",
    waiting_registry_office: "warning",
    requirement_open: "outline",
    overdue: "danger",
  } as const;

  const formatUpdatedAt = (value: string | null) => {
    const formatted = formatDateTime(value);

    if (formatted === "-") {
      return { date: "-", time: "" };
    }

    const [date, time] = formatted.split(", ");

    return {
      date,
      time: time ?? "",
    };
  };

  const getStatusLabel = (status: ProcessListItem["status"]) => {
    switch (status) {
      case "completed":
        return "Concluído";
      case "cancelled":
        return "Cancelado";
      case "waiting_supplier":
        return "Aguardando supplier";
      case "waiting_registry_office":
        return "Aguardando cartório";
      case "requirement_open":
        return "Exigência aberta";
      case "overdue":
        return "Em atraso";
      default:
        return "Em andamento";
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-background/95">
      <Table className="min-w-[880px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[260px]">Empreendimento</TableHead>
            <TableHead className="w-[220px]">Imóvel</TableHead>
            <TableHead className="w-[220px]">Comprador</TableHead>
            <TableHead>Etapa atual</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Atualizado em</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const updatedAt = formatUpdatedAt(item.updatedAt);

            return (
              <TableRow
                key={item.id}
                role="link"
                tabIndex={0}
                className="cursor-pointer transition-all duration-150 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                onClick={() => onViewProcess(item)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onViewProcess(item);
                  }
                }}
              >
                <TableCell>
                  <div className="space-y-1">
                      <p className="font-medium">{item.developmentName ?? "-"}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.supplierName ?? `Supplier #${item.supplierCompanyId}`}
                      </p>
                  </div>
                </TableCell>
                  <TableCell>{item.propertyLabel}</TableCell>
                  <TableCell>
                    <p className="font-medium">{item.buyerName ?? "-"}</p>
                  </TableCell>
                <TableCell>{item.stageName ?? "-"}</TableCell>
                <TableCell>
                  <Badge variant={statusVariantMap[item.status]}>{getStatusLabel(item.status)}</Badge>
                </TableCell>
                <TableCell>
                  <div className="leading-tight">
                    <p>{updatedAt.date}</p>
                    {updatedAt.time ? <p className="text-xs text-muted-foreground">{updatedAt.time}</p> : null}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
