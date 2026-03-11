import { Button, Card, CardContent, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, buttonVariants } from "@registra/ui";
import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";

import { PageHeader, RefreshAction } from "@/features/registration-core/components/page-header";
import { StatusBadge } from "@/features/registration-core/components/status-badge";
import {
  blockTitleLabels,
  documentStatusLabels,
  documentTypeLabels,
  documentUploadedByLabels,
  formatCnpj,
  formatDateTime,
} from "@/features/registration-core/core/registration-presenters";
import { buildSupplierWorkspaceSidebar } from "@/features/registration-core/core/workspace-sidebar";
import { useRegistrationWorkspaceQuery } from "@/features/registration-core/hooks/use-registration-workspace-query";
import { routes } from "@/shared/constants/routes";
import { useRegisterWorkspaceSidebar } from "@/shared/hooks/use-register-workspace-sidebar";

export function DocumentsPage() {
  const { supplierId } = useParams<{ supplierId?: string }>();
  const workspaceQuery = useRegistrationWorkspaceQuery();
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
  const documents = useMemo(
    () =>
      (workspaceQuery.data?.documents ?? []).filter((item) =>
        supplierId ? processMap.get(item.processId)?.supplierId === supplierId : true,
      ),
    [processMap, supplierId, workspaceQuery.data?.documents],
  );
  useRegisterWorkspaceSidebar(workspaceSidebar);

  return (
    <section className="space-y-6">
      <PageHeader
        title={supplier ? `Documentos de ${supplier.name}` : "Documentos"}
        description={
          supplier
            ? formatCnpj(supplier.cnpj)
            : "Aprove, reprove e solicite reenvio de documentos usados em certificado, contrato e registro."
        }
        actions={<RefreshAction onClick={() => workspaceQuery.refetch()} disabled={workspaceQuery.isFetching} />}
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Documento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Bloco</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Envio</TableHead>
                <TableHead className="text-right">Processo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{documentTypeLabels[item.type]}</TableCell>
                  <TableCell>{blockTitleLabels[item.block]}</TableCell>
                  <TableCell>{documentUploadedByLabels[item.uploadedBy]}</TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} label={documentStatusLabels[item.status]} />
                  </TableCell>
                  <TableCell>{formatDateTime(item.uploadedAt)}</TableCell>
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
