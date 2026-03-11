import { Card, CardContent, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, buttonVariants } from "@registra/ui";
import { Link } from "react-router-dom";

import { StatusBadge } from "@/features/operations/components/status-badge";
import { formatCnpj, supplierStatusLabels } from "@/features/operations/core/operations-presenters";
import { useOperationsWorkspaceQuery } from "@/features/operations/hooks/use-operations-workspace-query";
import { routes } from "@/shared/constants/routes";

export function SuppliersPage() {
  const workspaceQuery = useOperationsWorkspaceQuery();

  return (
    <section className="space-y-6">
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Empreendimentos</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workspaceQuery.data?.suppliers.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link to={routes.supplierDetailById(item.id)} className="font-medium text-primary underline-offset-4 hover:underline">
                      {item.name}
                    </Link>
                  </TableCell>
                  <TableCell>{formatCnpj(item.cnpj)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{item.contactName}</p>
                      <p className="text-muted-foreground">{item.contactEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} label={supplierStatusLabels[item.status]} />
                  </TableCell>
                  <TableCell>{item.developmentsCount}</TableCell>
                  <TableCell className="text-right">
                    <Link to={routes.supplierDetailById(item.id)} className={buttonVariants({ variant: "outline", size: "sm" })}>
                      Abrir cliente
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!workspaceQuery.data?.suppliers.length ? <div className="p-6 text-sm text-muted-foreground">Nenhum cliente encontrado.</div> : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-medium">Hierarquia obrigatória do sistema</p>
            <p className="text-sm text-muted-foreground">Cliente → Empreendimentos → Compradores → Processos de Registro</p>
          </div>
          <Link to={routes.developments} className={buttonVariants({ variant: "outline" })}>
            Abrir empreendimentos
          </Link>
        </CardContent>
      </Card>
    </section>
  );
}
