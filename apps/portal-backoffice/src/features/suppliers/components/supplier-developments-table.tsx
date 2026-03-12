import type { Development } from "@registra/shared";
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@registra/ui";

import { StatusBadge } from "@/features/registration-core/components/status-badge";
import {
  developmentStatusLabels,
  formatCnpj,
} from "@/features/registration-core/core/registration-presenters";

interface SupplierDevelopmentsTableProps {
  items: Development[];
  onEditDevelopment: (development: Development) => void;
  onViewBuyers: (development: Development) => void;
}

export function SupplierDevelopmentsTable({
  items,
  onEditDevelopment,
  onViewBuyers,
}: SupplierDevelopmentsTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Empreendimento</TableHead>
            <TableHead>CNPJ</TableHead>
            <TableHead>Endereco</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Compradores</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((development) => (
            <TableRow key={development.id}>
              <TableCell className="font-medium">{development.name}</TableCell>
              <TableCell>{formatCnpj(development.cnpj)}</TableCell>
              <TableCell>{development.address}</TableCell>
              <TableCell>
                <StatusBadge
                  status={development.status}
                  label={developmentStatusLabels[development.status]}
                />
              </TableCell>
              <TableCell>{development.buyersCount}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onViewBuyers(development)}
                  >
                    Ver compradores
                  </Button>
                  <Button type="button" size="sm" onClick={() => onEditDevelopment(development)}>
                    Editar empreendimento
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
