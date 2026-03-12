import { Button, Card, CardContent, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, buttonVariants } from "@registra/ui";
import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";

import { PageHeader, RefreshAction } from "@/features/registration-core/components/page-header";
import { StatusBadge } from "@/features/registration-core/components/status-badge";
import {
  formatCnpj,
  formatDateTime,
  taskStatusLabels,
  taskTypeLabels,
} from "@/features/registration-core/core/registration-presenters";
import { buildSupplierWorkspaceSidebar } from "@/features/registration-core/core/workspace-sidebar";
import { useRegistrationWorkspaceQuery } from "@/features/registration-core/hooks/use-registration-workspace-query";
import { routes } from "@/shared/constants/routes";
import { useRegisterWorkspaceSidebar } from "@/shared/hooks/use-register-workspace-sidebar";

export function TasksPage() {
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
  const tasks = useMemo(
    () =>
      (workspaceQuery.data?.tasks ?? []).filter((item) =>
        supplierId ? processMap.get(item.processId)?.supplierId === supplierId : true,
      ),
    [processMap, supplierId, workspaceQuery.data?.tasks],
  );
  useRegisterWorkspaceSidebar(workspaceSidebar);

  return (
    <section className="space-y-6">
      <PageHeader
        title={supplier ? `Tarefas de ${supplier.name}` : "Tarefas"}
        description={
          supplier
            ? formatCnpj(supplier.cnpj)
            : "Backoffice opera centenas de processos com tarefas de contato, validação, análise, correção, envio e acompanhamento."
        }
        actions={
          <>
            <RefreshAction onClick={() => workspaceQuery.refetch()} disabled={workspaceQuery.isFetching} />
            <Button type="button" size="sm">Criar tarefa</Button>
          </>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Processo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>{taskTypeLabels[item.type]}</TableCell>
                  <TableCell>{item.assignee}</TableCell>
                  <TableCell>{formatDateTime(item.dueAt)}</TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} label={taskStatusLabels[item.status]} />
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
