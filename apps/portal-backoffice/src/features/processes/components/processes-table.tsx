import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@registra/ui";

import type { ProcessListItem } from "@/features/processes/core/process-schema";
import { formatDateTime } from "@/shared/utils/format-date-time";

interface ProcessesTableProps {
  items: ProcessListItem[];
  onViewProcess: (process: ProcessListItem) => void;
  showSupplierColumn: boolean;
}

export function ProcessesTable({
  items,
  onViewProcess,
  showSupplierColumn,
}: ProcessesTableProps) {
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

  const getWaitingOnLabel = (value: ProcessListItem["waitingOn"]) => {
    switch (value) {
      case "buyer":
        return "Comprador";
      case "supplier":
        return "Supplier";
      case "registry_office":
        return "Cartório";
      case "backoffice":
        return "Backoffice";
      default:
        return "-";
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-background/95">
      <Table className="min-w-[1240px]">
        <TableHeader>
          <TableRow>
            {showSupplierColumn ? <TableHead className="w-[180px]">Supplier</TableHead> : null}
            <TableHead>Empreendimento</TableHead>
            <TableHead className="w-[280px]">Imóvel</TableHead>
            <TableHead>Comprador</TableHead>
            <TableHead>Workflow</TableHead>
            <TableHead>Etapa atual</TableHead>
            <TableHead>Aguardando</TableHead>
            <TableHead>Pendências</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Prazo</TableHead>
            <TableHead>Atualizado em</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
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
              {showSupplierColumn ? (
                <TableCell className="text-muted-foreground">
                  {item.supplierName ?? `Supplier #${item.supplierCompanyId}`}
                </TableCell>
              ) : null}
              <TableCell>{item.developmentName ?? "-"}</TableCell>
              <TableCell>
                <div className="space-y-1">
                  <p className="font-medium">{item.propertyLabel}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.registrationNumber ? `Matrícula ${item.registrationNumber}` : `Processo #${item.id}`}
                  </p>
                </div>
              </TableCell>
              <TableCell>{item.buyerName ?? "-"}</TableCell>
              <TableCell>{item.workflowName ?? "-"}</TableCell>
              <TableCell>{item.stageName ?? "-"}</TableCell>
              <TableCell>{getWaitingOnLabel(item.waitingOn)}</TableCell>
              <TableCell>{item.pendingRequirements}</TableCell>
              <TableCell>{getStatusLabel(item.status)}</TableCell>
              <TableCell>{item.dueAt ? formatDateTime(item.dueAt) : "-"}</TableCell>
              <TableCell>{item.updatedAt ? formatDateTime(item.updatedAt) : "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
