import { formatPhoneInput, type SupplierInternalUser } from "@registra/shared";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@registra/ui";

import { formatDateTime } from "@/shared/utils/format-date-time";

interface SupplierInternalUsersTableProps {
  items: SupplierInternalUser[];
}

export function SupplierInternalUsersTable({ items }: SupplierInternalUsersTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/80">
      <div className="max-h-[420px] overflow-auto">
        <Table className="min-w-[760px]">
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow>
              <TableHead className="w-[240px]">Usuario</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[160px]">Criado em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phone ? formatPhoneInput(user.phone) : "-"}</TableCell>
                <TableCell>{user.role ?? "-"}</TableCell>
                <TableCell>{user.status ?? "-"}</TableCell>
                <TableCell>{formatDateTime(user.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
