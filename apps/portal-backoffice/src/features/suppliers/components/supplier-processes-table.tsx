import type { SupplierProcessListItem } from "@registra/shared";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@registra/ui";

import { SupplierStatusBadge } from "@/features/suppliers/components/supplier-status-badge";
import {
  getSupplierProcessStatusLabel,
  mapProcessStatusToSupplierStatus,
} from "@/features/suppliers/utils/supplier-process-status";
import { formatDateTime } from "@/shared/utils/format-date-time";

interface SupplierProcessesTableProps {
  items: SupplierProcessListItem[];
}

export function SupplierProcessesTable({ items }: SupplierProcessesTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Protocolo</TableHead>
            <TableHead>Processo</TableHead>
            <TableHead>Empreendimento</TableHead>
            <TableHead>Workflow</TableHead>
            <TableHead>Etapa atual</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Criado em</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((process) => (
            <TableRow key={process.id}>
              <TableCell className="font-medium">{process.protocol}</TableCell>
              <TableCell>{process.title}</TableCell>
              <TableCell>{process.developmentName ?? "-"}</TableCell>
              <TableCell>{process.workflowName}</TableCell>
              <TableCell>{process.currentStepName ?? "-"}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <SupplierStatusBadge status={mapProcessStatusToSupplierStatus(process.status)} />
                  <span className="text-xs text-muted-foreground">
                    {getSupplierProcessStatusLabel(process.status)}
                  </span>
                </div>
              </TableCell>
              <TableCell>{formatDateTime(process.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
