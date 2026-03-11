import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from "@registra/ui";
import type {
  ProcessDocument,
  ProcessNotification,
  ProcessRequest,
  ProcessSubmission,
  WorkflowBlockKey,
} from "@registra/shared";
import { Download, Eye, FileText, RotateCcw, ShieldCheck, XCircle } from "lucide-react";
import { useMemo, useState } from "react";

import { StatusBadge } from "@/features/operations/components/status-badge";
import {
  blockTitleLabels,
  documentStatusLabels,
  documentTypeLabels,
  documentUploadedByLabels,
  formatDateTime,
  requestStatusLabels,
  requestTargetLabels,
} from "@/features/operations/core/operations-presenters";

const blockOrder: WorkflowBlockKey[] = ["certificate", "contract", "registration"];

function downloadDocument(fileDocument: ProcessDocument) {
  const blob = new Blob(
    [
      [
        `Arquivo: ${fileDocument.name}`,
        `Bloco: ${blockTitleLabels[fileDocument.block]}`,
        `Tipo: ${documentTypeLabels[fileDocument.type]}`,
        `Enviado por: ${documentUploadedByLabels[fileDocument.uploadedBy]}`,
        `Versão: v${fileDocument.version}`,
        `Status: ${documentStatusLabels[fileDocument.status]}`,
        `Data: ${formatDateTime(fileDocument.uploadedAt)}`,
        `Comentários: ${fileDocument.comments ?? "-"}`,
      ].join("\n"),
    ],
    { type: "text/plain;charset=utf-8" },
  );

  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = `${fileDocument.name}.txt`;
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

interface DocumentWorkflowManagerProps {
  documents: ProcessDocument[];
  requests: ProcessRequest[];
  submissions: ProcessSubmission[];
  notifications: ProcessNotification[];
  onApprove: (documentId: string, comment: string) => void;
  onReject: (documentId: string, comment: string) => void;
  onRequestResubmission: (documentId: string, comment: string) => void;
}

export function DocumentWorkflowManager({
  documents,
  requests,
  submissions,
  notifications,
  onApprove,
  onReject,
  onRequestResubmission,
}: DocumentWorkflowManagerProps) {
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");

  const requestMap = useMemo(() => new Map(requests.map((request) => [request.id, request])), [requests]);

  const selectedDocument = useMemo(
    () => documents.find((document) => document.id === selectedDocumentId) ?? null,
    [documents, selectedDocumentId],
  );

  const selectedRequest = selectedDocument ? requestMap.get(selectedDocument.requestId) ?? null : null;
  const selectedSubmissions = useMemo(() => {
    if (!selectedRequest) {
      return [];
    }

    return submissions.filter((submission) => submission.requestId === selectedRequest.id);
  }, [selectedRequest, submissions]);

  const selectedVersions = useMemo(() => {
    if (!selectedDocument) {
      return [];
    }

    return documents
      .filter(
        (document) =>
          document.processId === selectedDocument.processId &&
          document.block === selectedDocument.block &&
          document.name === selectedDocument.name,
      )
      .sort((left, right) => right.version - left.version);
  }, [documents, selectedDocument]);

  return (
    <div className="space-y-4">
      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle>Documentos</CardTitle>
          <CardDescription>
            Workflow documental com envio, recebimento, aprovação, reprovação, reenvio e versionamento por bloco.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {blockOrder.map((block) => {
            const items = documents
              .filter((document) => document.block === block)
              .sort((left, right) => right.version - left.version);

            return (
              <section key={block} className="space-y-3">
                <div>
                  <h3 className="font-medium">{blockTitleLabels[block]}</h3>
                  <p className="text-sm text-muted-foreground">Documentos agrupados por bloco do processo.</p>
                </div>

                {items.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border border-border/70">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Documento</TableHead>
                          <TableHead>Solicitação</TableHead>
                          <TableHead>Enviado por</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((document) => {
                          const request = requestMap.get(document.requestId);

                          return (
                            <TableRow key={document.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">
                                    {document.name} <span className="text-xs text-muted-foreground">v{document.version}</span>
                                  </p>
                                  <p className="text-xs text-muted-foreground">{documentTypeLabels[document.type]}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <p className="text-sm font-medium">{request?.title ?? "-"}</p>
                                  {request ? (
                                    <p className="text-xs text-muted-foreground">
                                      {requestTargetLabels[request.target]} · {requestStatusLabels[request.status]}
                                    </p>
                                  ) : null}
                                </div>
                              </TableCell>
                              <TableCell>{documentUploadedByLabels[document.uploadedBy]}</TableCell>
                              <TableCell>{formatDateTime(document.uploadedAt)}</TableCell>
                              <TableCell>
                                <StatusBadge status={document.status} label={documentStatusLabels[document.status]} />
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-2">
                                  <Button type="button" size="sm" variant="outline" onClick={() => setSelectedDocumentId(document.id)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Ver
                                  </Button>
                                  <Button type="button" size="sm" variant="outline" onClick={() => downloadDocument(document)}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Baixar
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border/80 p-6 text-sm text-muted-foreground">
                    Nenhum documento registrado neste bloco.
                  </div>
                )}
              </section>
            );
          })}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle>Notificações do workflow</CardTitle>
          <CardDescription>
            Eventos relevantes disparados para cliente, comprador ou backoffice durante o fluxo documental.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {notifications.map((notification) => (
            <div key={notification.id} className="rounded-xl border border-border/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{notification.title}</p>
                <span className="text-xs text-muted-foreground">{formatDateTime(notification.createdAt)}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{notification.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Sheet open={Boolean(selectedDocument)} onOpenChange={(open) => !open && setSelectedDocumentId(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
          {selectedDocument ? (
            <div className="space-y-6">
              <SheetHeader>
                <SheetTitle>{selectedDocument.name}</SheetTitle>
                <SheetDescription>
                  Preview documental com ações do backoffice, dados da solicitação vinculada e histórico de versões.
                </SheetDescription>
              </SheetHeader>

              <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-6 text-center">
                <FileText className="mx-auto h-10 w-10 text-primary" />
                <p className="mt-3 font-medium">Preview do documento</p>
                <p className="text-sm text-muted-foreground">
                  Ambiente mockado: use o download para inspecionar os metadados do arquivo.
                </p>
              </div>

              <div className="grid gap-4 rounded-xl border border-border/70 p-4 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Bloco</p>
                  <p className="mt-1 font-medium">{blockTitleLabels[selectedDocument.block]}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Enviado por</p>
                  <p className="mt-1 font-medium">{documentUploadedByLabels[selectedDocument.uploadedBy]}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Status</p>
                  <div className="mt-1">
                    <StatusBadge status={selectedDocument.status} label={documentStatusLabels[selectedDocument.status]} />
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Versão</p>
                  <p className="mt-1 font-medium">v{selectedDocument.version}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Solicitação vinculada</p>
                  <p className="mt-1 font-medium">{selectedRequest?.title ?? "Sem solicitação vinculada"}</p>
                  {selectedRequest ? (
                    <p className="text-sm text-muted-foreground">
                      {requestTargetLabels[selectedRequest.target]} · {requestStatusLabels[selectedRequest.status]} · prazo{" "}
                      {formatDateTime(selectedRequest.deadline)}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-border/70 p-4">
                <h3 className="font-medium">Comentários do backoffice</h3>
                <Textarea
                  rows={4}
                  placeholder="Adicione um comentário para aprovação, reprovação ou solicitação de reenvio."
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => downloadDocument(selectedDocument)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button type="button" onClick={() => onApprove(selectedDocument.id, commentDraft)}>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Aprovar
                  </Button>
                  <Button type="button" variant="outline" onClick={() => onReject(selectedDocument.id, commentDraft)}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Reprovar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onRequestResubmission(selectedDocument.id, commentDraft)}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Solicitar reenvio
                  </Button>
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-border/70 p-4">
                <h3 className="font-medium">Submissões vinculadas</h3>
                {selectedSubmissions.length > 0 ? (
                  selectedSubmissions.map((submission) => (
                    <div key={submission.id} className="rounded-lg border border-border/70 p-3">
                      <p className="text-sm font-medium">{documentUploadedByLabels[submission.submittedBy]}</p>
                      <p className="text-sm text-muted-foreground">{submission.notes}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(submission.submittedAt)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma submissão registrada para esta solicitação.</p>
                )}
              </div>

              <div className="space-y-3 rounded-xl border border-border/70 p-4">
                <h3 className="font-medium">Histórico de versões</h3>
                {selectedVersions.map((version) => (
                  <div key={version.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/70 p-3">
                    <div>
                      <p className="font-medium">
                        {version.name} · v{version.version}
                      </p>
                      <p className="text-sm text-muted-foreground">{formatDateTime(version.uploadedAt)}</p>
                    </div>
                    <StatusBadge status={version.status} label={documentStatusLabels[version.status]} />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
