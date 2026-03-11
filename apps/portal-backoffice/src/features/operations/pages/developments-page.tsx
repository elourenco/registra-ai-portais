import { Card, CardContent, CardDescription, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@registra/ui";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { StatusBadge } from "@/features/operations/components/status-badge";
import { buildSupplierWorkspaceSidebar } from "@/features/operations/core/workspace-sidebar";
import { developmentStatusLabels, formatCnpj } from "@/features/operations/core/operations-presenters";
import { useOperationsWorkspaceQuery } from "@/features/operations/hooks/use-operations-workspace-query";
import { routes } from "@/shared/constants/routes";
import { useRegisterPageHeader } from "@/shared/hooks/use-register-page-header";
import { useRegisterWorkspaceSidebar } from "@/shared/hooks/use-register-workspace-sidebar";

export function DevelopmentsPage() {
  const navigate = useNavigate();
  const workspaceQuery = useOperationsWorkspaceQuery();
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
              to: "/developments/new",
            },
          ],
          showNotifications: false,
        }
      : null,
  );

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Empreendimentos cadastrados</CardTitle>
          <CardDescription>
            Lista completa dos empreendimentos vinculados ao cliente atual, sem atalhos cruzados
            para compradores.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empreendimento</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Compradores</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {developments.map((item) => (
                <TableRow
                  key={item.id}
                  className={supplierId ? "cursor-pointer" : undefined}
                  onClick={() => {
                    if (supplierId) {
                      navigate(routes.supplierDevelopmentBuyersById(supplierId, item.id));
                    }
                  }}
                >
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{formatCnpj(item.cnpj)}</TableCell>
                  <TableCell>{item.address}</TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} label={developmentStatusLabels[item.status]} />
                  </TableCell>
                  <TableCell>{item.buyersCount}</TableCell>
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
