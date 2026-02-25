import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@registra/ui";
import type { CustomerListItem } from "@registra/shared";

import { CustomerStatusBadge } from "@/features/customers/components/customer-status-badge";

interface CustomersTableProps {
  items: CustomerListItem[];
  onViewCustomer: (customerId: string) => void;
}

function formatDateTime(value: string): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsed);
}

export function CustomersTable({ items, onViewCustomer }: CustomersTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[260px]">Nome</TableHead>
            <TableHead>Documento</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Segmento</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell className="font-medium">{customer.fullName}</TableCell>
              <TableCell>{customer.document}</TableCell>
              <TableCell>{customer.email}</TableCell>
              <TableCell>{customer.segment}</TableCell>
              <TableCell>
                <CustomerStatusBadge status={customer.status} />
              </TableCell>
              <TableCell>{formatDateTime(customer.createdAt)}</TableCell>
              <TableCell className="text-right">
                <Button type="button" size="sm" variant="outline" onClick={() => onViewCustomer(customer.id)}>
                  Ver detalhe
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
