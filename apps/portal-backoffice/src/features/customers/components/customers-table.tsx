import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@registra/ui";
import type { CustomerListItem } from "@registra/shared";

import { CustomerStatusBadge } from "@/features/customers/components/customer-status-badge";
import { formatDateTime } from "@/shared/utils/format-date-time";

interface CustomersTableProps {
  items: CustomerListItem[];
  onViewCustomer: (customerId: string) => void;
}

export function CustomersTable({ items, onViewCustomer }: CustomersTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-background/95">
      <Table className="min-w-[860px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[260px]">Nome</TableHead>
            <TableHead>Documento</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Segmento</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Criado em</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((customer) => (
            <TableRow
              key={customer.id}
              role="link"
              tabIndex={0}
              className="cursor-pointer transition-all duration-150 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              onClick={() => onViewCustomer(customer.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onViewCustomer(customer.id);
                }
              }}
            >
              <TableCell className="font-medium">{customer.fullName}</TableCell>
              <TableCell>{customer.document}</TableCell>
              <TableCell>{customer.email}</TableCell>
              <TableCell>{customer.segment}</TableCell>
              <TableCell>
                <CustomerStatusBadge status={customer.status} />
              </TableCell>
              <TableCell>{formatDateTime(customer.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
