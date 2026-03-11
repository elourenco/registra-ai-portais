import { Button, Card, CardContent, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, buttonVariants } from "@registra/ui";
import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";

import { PageHeader, RefreshAction } from "@/features/operations/components/page-header";
import { StatusBadge } from "@/features/operations/components/status-badge";
import { formatCnpj, formatDateTime, requirementStatusLabels } from "@/features/operations/core/operations-presenters";
import { buildSupplierWorkspaceSidebar } from "@/features/operations/core/workspace-sidebar";
import { useOperationsWorkspaceQuery } from "@/features/operations/hooks/use-operations-workspace-query";
import { routes } from "@/shared/constants/routes";
import { useRegisterWorkspaceSidebar } from "@/shared/hooks/use-register-workspace-sidebar";

export function RequirementsPage() {
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
  const requirements = useMemo(
    () =>
      (workspaceQuery.data?.requirements ?? []).filter((item) =>
        supplierId ? processMap.get(item.processId)?.supplierId === supplierId : true,
      ),
    [processMap, supplierId, workspaceQuery.data?.requirements],
  );
  useRegisterWorkspaceSidebar(workspaceSidebar);

  return (
    <section className="space-y-6">
      <PageHeader
        title={supplier ? `Exigências de ${supplier.name}` : "Exigências"}
        description={
          supplier
            ? formatCnpj(supplier.cnpj)
            : "Registre exigências do cartório, acompanhe a resolução e dispare ações obrigatórias ao cliente."
        }
        actions={
          <>
            <RefreshAction onClick={() => workspaceQuery.refetch()} disabled={workspaceQuery.isFetching} />
            <Button type="button" size="sm">Registrar exigência</Button>
          </>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ação do cliente</TableHead>
                <TableHead>Abertura</TableHead>
                <TableHead className="text-right">Processo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requirements.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} label={requirementStatusLabels[item.status]} />
                  </TableCell>
                  <TableCell>{item.supplierActionRequired ? "Obrigatória" : "Não"}</TableCell>
                  <TableCell>{formatDateTime(item.createdAt)}</TableCell>
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
