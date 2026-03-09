import { formatCnpj, type SupplierListItem } from "@registra/shared";
import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@registra/ui";

import { SupplierStatusBadge } from "@/features/suppliers/components/supplier-status-badge";

interface SuppliersTableProps {
  items: SupplierListItem[];
  onViewSupplier: (supplierId: string) => void;
}

export function SuppliersTable({
  items,
  onViewSupplier,
}: SuppliersTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[280px]">Empresa</TableHead>
            <TableHead>CNPJ</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead className="min-w-[280px]">Workflow</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((supplier) => {
            const workflowLabel = supplier.workflowName ?? "Workflow default";
            const inheritedFromDefault = !supplier.workflowId;

            return (
              <TableRow
                key={supplier.id}
                role="link"
                tabIndex={0}
                className="cursor-pointer transition-all duration-150 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                onClick={() => onViewSupplier(supplier.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onViewSupplier(supplier.id);
                  }
                }}
              >
                <TableCell className="font-medium">{supplier.legalName}</TableCell>
                <TableCell className="text-muted-foreground">{formatCnpj(supplier.cnpj)}</TableCell>
                <TableCell className="text-muted-foreground">{supplier.email}</TableCell>
                <TableCell>
                  <div className="space-y-1.5">
                    <Badge
                      variant="outline"
                      className="border-slate-200 bg-slate-50 text-slate-700"
                    >
                      {workflowLabel}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {inheritedFromDefault
                        ? "Herdado do workflow default"
                        : "Vínculo customizado para este supplier"}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <SupplierStatusBadge status={supplier.status} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
