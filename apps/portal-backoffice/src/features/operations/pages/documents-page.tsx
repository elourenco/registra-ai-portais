import { Button, Card, CardContent, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, buttonVariants } from "@registra/ui";
import { Link } from "react-router-dom";

import { PageHeader, RefreshAction } from "@/features/operations/components/page-header";
import { StatusBadge } from "@/features/operations/components/status-badge";
import {
  blockTitleLabels,
  documentStatusLabels,
  documentTypeLabels,
  documentUploadedByLabels,
  formatDateTime,
} from "@/features/operations/core/operations-presenters";
import { useOperationsWorkspaceQuery } from "@/features/operations/hooks/use-operations-workspace-query";
import { routes } from "@/shared/constants/routes";

export function DocumentsPage() {
  const workspaceQuery = useOperationsWorkspaceQuery();

  return (
    <section className="space-y-6">
      <PageHeader
        title="Documentos"
        description="Aprove, reprove e solicite reenvio de documentos usados em certificado, contrato e registro."
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
              {workspaceQuery.data?.documents.map((item) => (
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
