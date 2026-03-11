import { Card, CardContent, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, buttonVariants } from "@registra/ui";
import { Link } from "react-router-dom";

import { PageHeader, RefreshAction } from "@/features/operations/components/page-header";
import { StatusBadge } from "@/features/operations/components/status-badge";
import { developmentStatusLabels, formatCnpj } from "@/features/operations/core/operations-presenters";
import { useOperationsWorkspaceQuery } from "@/features/operations/hooks/use-operations-workspace-query";
import { routes } from "@/shared/constants/routes";

export function DevelopmentsPage() {
  const workspaceQuery = useOperationsWorkspaceQuery();
  const supplierMap = new Map(workspaceQuery.data?.suppliers.map((item) => [item.id, item.name]) ?? []);

  return (
    <section className="space-y-6">
      <PageHeader
        title="Empreendimentos"
        description="Cada empreendimento pertence a um cliente e organiza a carteira de compradores e processos."
        actions={
          <>
            <RefreshAction onClick={() => workspaceQuery.refetch()} disabled={workspaceQuery.isFetching} />
            <Link to={routes.developmentRegistration} className={buttonVariants({ size: "sm" })}>
              Cadastrar empreendimento
            </Link>
          </>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empreendimento</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Compradores</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workspaceQuery.data?.developments.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link to={routes.developmentDetailById(item.id)} className="font-medium text-primary underline-offset-4 hover:underline">
                      {item.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link to={routes.supplierDetailById(item.supplierId)} className="text-primary underline-offset-4 hover:underline">
                      {supplierMap.get(item.supplierId) ?? "-"}
                    </Link>
                  </TableCell>
                  <TableCell>{formatCnpj(item.cnpj)}</TableCell>
                  <TableCell>{item.address}</TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} label={developmentStatusLabels[item.status]} />
                  </TableCell>
                  <TableCell>
                    <Link to={routes.developmentDetailById(item.id)} className={buttonVariants({ variant: "outline", size: "sm" })}>
                      {item.buyersCount} vinculados
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
