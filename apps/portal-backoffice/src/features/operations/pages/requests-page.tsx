import { Button, Card, CardContent, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, buttonVariants } from "@registra/ui";
import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";

import { PageHeader, RefreshAction } from "@/features/operations/components/page-header";
import { StatusBadge } from "@/features/operations/components/status-badge";
import {
  blockTitleLabels,
  formatCnpj,
  formatDateTime,
  requestStatusLabels,
  requestTargetLabels,
  requestTypeLabels,
} from "@/features/operations/core/operations-presenters";
import { buildSupplierWorkspaceSidebar } from "@/features/operations/core/workspace-sidebar";
import { useOperationsWorkspaceQuery } from "@/features/operations/hooks/use-operations-workspace-query";
import { routes } from "@/shared/constants/routes";
import { useRegisterWorkspaceSidebar } from "@/shared/hooks/use-register-workspace-sidebar";

export function RequestsPage() {
  const { supplierId } = useParams<{ supplierId?: string }>();
  const workspaceQuery = useOperationsWorkspaceQuery();
  const supplier = useMemo(
    () => workspaceQuery.data?.suppliers.find((item) => item.id === supplierId) ?? null,
    [supplierId, workspaceQuery.data?.suppliers],
  );
  const workspaceSidebar = useMemo(() => {
    if (!supplier) {
      return null;
    }

    return buildSupplierWorkspaceSidebar({
      supplierId: supplier.id,
      supplierName: supplier.name,
      supplierCnpj: supplier.cnpj,
    });
  }, [supplier]);
  const processMap = useMemo(
    () => new Map(workspaceQuery.data?.processes.map((item) => [item.id, item]) ?? []),
    [workspaceQuery.data?.processes],
  );
  const requests = useMemo(
    () =>
      (workspaceQuery.data?.requests ?? []).filter((item) =>
        supplierId ? processMap.get(item.processId)?.supplierId === supplierId : true,
      ),
    [processMap, supplierId, workspaceQuery.data?.requests],
  );
  useRegisterWorkspaceSidebar(workspaceSidebar);

  return (
    <section className="space-y-6">
      <PageHeader
        title={supplier ? `Solicitações de ${supplier.name}` : "Solicitações"}
        description={
          supplier
            ? formatCnpj(supplier.cnpj)
            : "Solicitações são o motor do workflow. Cada item transforma uma pendência em ação objetiva para supplier ou comprador."
        }
        actions={
          <>
            <RefreshAction onClick={() => workspaceQuery.refetch()} disabled={workspaceQuery.isFetching} />
            <Button type="button" size="sm">Criar solicitação</Button>
          </>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Bloco</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Processo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{requestTypeLabels[item.type]}</TableCell>
                  <TableCell>{blockTitleLabels[item.block]}</TableCell>
                  <TableCell>{requestTargetLabels[item.target]}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{formatDateTime(item.deadline)}</TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} label={requestStatusLabels[item.status]} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      to={
                        supplierId && processMap.get(item.processId)
                          ? routes.supplierDevelopmentBuyerProcessDetailById(
                              processMap.get(item.processId)!.supplierId,
                              processMap.get(item.processId)!.developmentId,
                              processMap.get(item.processId)!.buyerId,
                              item.processId,
                            )
                          : routes.processDetailById(item.processId)
                      }
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      Abrir
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
