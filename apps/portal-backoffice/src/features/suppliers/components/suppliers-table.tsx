import { formatCnpj, type SupplierListItem } from "@registra/shared";
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@registra/ui";

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
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-background/95">
      <Table className="min-w-[720px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[280px]">Empresa</TableHead>
            <TableHead>CNPJ</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[140px] text-right">Acao</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((supplier) => (
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
                <SupplierStatusBadge status={supplier.status} />
              </TableCell>
              <TableCell className="text-right">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation();
                    onViewSupplier(supplier.id);
                  }}
                >
                  Mais detalhes
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
