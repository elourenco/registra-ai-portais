import { type BackofficeUser } from "@registra/shared";
import { Badge, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@registra/ui";

import { BackofficeUserStatusBadge } from "@/features/backoffice-users/components/backoffice-user-status-badge";
import { formatDateTime } from "@/shared/utils/format-date-time";

interface BackofficeUsersTableProps {
  items: BackofficeUser[];
  onDeleteUser: (user: BackofficeUser) => void;
  onEditUser: (user: BackofficeUser) => void;
}

function getRoleLabel() {
  return "Administrador";
}

export function BackofficeUsersTable({
  items,
  onDeleteUser,
  onEditUser,
}: BackofficeUsersTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[240px]">Nome</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Perfil</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                  {getRoleLabel()}
                </Badge>
              </TableCell>
              <TableCell>
                <BackofficeUserStatusBadge status={user.status} />
              </TableCell>
              <TableCell>{formatDateTime(user.createdAt)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => onEditUser(user)}>
                    Editar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                    onClick={() => onDeleteUser(user)}
                  >
                    Excluir
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
