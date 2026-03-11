import { Button, Card, CardContent, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, buttonVariants } from "@registra/ui";
import { Link } from "react-router-dom";

import { PageHeader, RefreshAction } from "@/features/operations/components/page-header";
import { StatusBadge } from "@/features/operations/components/status-badge";
import { formatDateTime, taskStatusLabels, taskTypeLabels } from "@/features/operations/core/operations-presenters";
import { useOperationsWorkspaceQuery } from "@/features/operations/hooks/use-operations-workspace-query";
import { routes } from "@/shared/constants/routes";

export function TasksPage() {
  const workspaceQuery = useOperationsWorkspaceQuery();

  return (
    <section className="space-y-6">
      <PageHeader
        title="Tarefas"
        description="Backoffice opera centenas de processos com tarefas de contato, validação, análise, correção, envio e acompanhamento."
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
              {workspaceQuery.data?.tasks.map((item) => (
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
