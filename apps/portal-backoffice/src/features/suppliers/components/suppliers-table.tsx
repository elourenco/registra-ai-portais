import { formatCnpj, type SupplierListItem } from "@registra/shared";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@registra/ui";

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
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
      <Table className="min-w-[640px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[280px]">Empresa</TableHead>
            <TableHead>CNPJ</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((supplier) => (
            <TableRow
              key={supplier.id}
              role="link"
              tabIndex={0}
              className="cursor-pointer transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
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
                <SupplierStatusBadge status={supplier.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
