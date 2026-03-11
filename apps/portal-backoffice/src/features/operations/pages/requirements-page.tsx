import { Button, Card, CardContent, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, buttonVariants } from "@registra/ui";
import { Link } from "react-router-dom";

import { PageHeader, RefreshAction } from "@/features/operations/components/page-header";
import { StatusBadge } from "@/features/operations/components/status-badge";
import { formatDateTime, requirementStatusLabels } from "@/features/operations/core/operations-presenters";
import { useOperationsWorkspaceQuery } from "@/features/operations/hooks/use-operations-workspace-query";
import { routes } from "@/shared/constants/routes";

export function RequirementsPage() {
  const workspaceQuery = useOperationsWorkspaceQuery();

  return (
    <section className="space-y-6">
      <PageHeader
        title="Exigências"
        description="Registre exigências do cartório, acompanhe a resolução e dispare ações obrigatórias ao cliente."
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
              {workspaceQuery.data?.requirements.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} label={requirementStatusLabels[item.status]} />
                  </TableCell>
                  <TableCell>{item.supplierActionRequired ? "Obrigatória" : "Não"}</TableCell>
                  <TableCell>{formatDateTime(item.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Link to={routes.processDetailById(item.processId)} className={buttonVariants({ variant: "outline", size: "sm" })}>
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
