import { Card, CardContent, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, buttonVariants } from "@registra/ui";
import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";

import { StatusBadge } from "@/features/operations/components/status-badge";
import { buildSupplierWorkspaceSidebar } from "@/features/operations/core/workspace-sidebar";
import { developmentStatusLabels, formatCnpj } from "@/features/operations/core/operations-presenters";
import { useOperationsWorkspaceQuery } from "@/features/operations/hooks/use-operations-workspace-query";
import { routes } from "@/shared/constants/routes";
import { useRegisterPageHeader } from "@/shared/hooks/use-register-page-header";
import { useRegisterWorkspaceSidebar } from "@/shared/hooks/use-register-workspace-sidebar";

export function DevelopmentsPage() {
  const workspaceQuery = useOperationsWorkspaceQuery();
  const supplierMap = new Map(workspaceQuery.data?.suppliers.map((item) => [item.id, item.name]) ?? []);
  const { supplierId } = useParams<{ supplierId?: string }>();
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
  const developments = useMemo(
    () =>
      (workspaceQuery.data?.developments ?? []).filter((item) =>
        supplierId ? item.supplierId === supplierId : true,
      ),
    [supplierId, workspaceQuery.data?.developments],
  );

  useRegisterWorkspaceSidebar(workspaceSidebar);
  useRegisterPageHeader(
    supplier
      ? {
          title: "Empreendimentos",
          description: "Empreendimentos do cliente",
          actions: [
            {
              label: "Cadastrar empreendimento",
              to: routes.developmentRegistration,
            },
          ],
          showNotifications: false,
        }
      : null,
  );

  return (
    <section className="space-y-6">
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
              {developments.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link
                      to={
                        supplierId
                          ? routes.supplierDevelopmentDetailById(supplierId, item.id)
                          : routes.developmentDetailById(item.id)
                      }
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
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
                    <Link
                      to={
                        supplierId
                          ? routes.supplierDevelopmentDetailById(supplierId, item.id)
                          : routes.developmentDetailById(item.id)
                      }
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      {item.buyersCount} vinculados
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!developments.length ? (
            <div className="p-6 text-sm text-muted-foreground">
              Nenhum empreendimento encontrado.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
