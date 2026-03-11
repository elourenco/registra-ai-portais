import {
  Badge,
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@registra/ui";
import type { ProcessDocument, ProcessRequest, ProcessSubmission, WorkflowBlock } from "@registra/shared";
import { Download, FileText, MessageSquareText } from "lucide-react";

import {
  blockTitleLabels,
  documentStatusLabels,
  formatDateTime,
  requestStatusLabels,
} from "@/features/operations/core/operations-presenters";

interface WorkflowBuyerResponseSheetProps {
  block: WorkflowBlock;
  documents: ProcessDocument[];
  requests: ProcessRequest[];
  submissions: ProcessSubmission[];
}

function downloadBuyerDocument(document: ProcessDocument) {
  const blob = new Blob(
    [
      [
        `Documento: ${document.name}`,
        `Bloco: ${blockTitleLabels[document.block]}`,
        `Status: ${documentStatusLabels[document.status]}`,
        `Versão: v${document.version}`,
        `Enviado por: Comprador`,
        `Data de envio: ${formatDateTime(document.uploadedAt)}`,
        `Comentários: ${document.comments ?? "Sem comentários."}`,
      ].join("\n"),
    ],
    { type: "text/plain;charset=utf-8" },
  );

  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = `${document.name}.txt`;
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function WorkflowBuyerResponseSheet({
  block,
  documents,
  requests,
  submissions,
}: WorkflowBuyerResponseSheetProps) {
  const buyerRequests = requests.filter((request) => request.target === "buyer");
  const buyerRequestIds = new Set(buyerRequests.map((request) => request.id));
  const buyerSubmissions = submissions.filter(
    (submission) => submission.submittedBy === "buyer" && buyerRequestIds.has(submission.requestId),
  );
  const buyerDocuments = documents.filter((document) => document.uploadedBy === "buyer");

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          Ver respostas do comprador
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        <div className="space-y-6 p-6">
          <SheetHeader>
            <SheetTitle>{block.title} · Respostas do comprador</SheetTitle>
            <SheetDescription>
              Consulte respostas textuais, solicitações respondidas e documentos enviados pelo comprador neste bloco.
            </SheetDescription>
          </SheetHeader>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquareText className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-base font-semibold">Solicitações respondidas</h3>
            </div>
            {buyerRequests.length > 0 ? (
              buyerRequests.map((request) => (
                <article key={request.id} className="rounded-2xl border border-border/70 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{requestStatusLabels[request.status]}</Badge>
                    <span className="text-xs text-muted-foreground">
                      Enviada em {formatDateTime(request.sentAt)}
                    </span>
                  </div>
                  <p className="mt-3 font-medium">{request.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{request.description}</p>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border/80 p-4 text-sm text-muted-foreground">
                Nenhuma solicitação ao comprador foi respondida neste bloco até agora.
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquareText className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-base font-semibold">Mensagens e observações</h3>
            </div>
            {buyerSubmissions.length > 0 ? (
              buyerSubmissions.map((submission) => (
                <article key={submission.id} className="rounded-2xl border border-border/70 p-4">
                  <p className="text-sm leading-6 text-foreground/85">{submission.notes}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Respondido em {formatDateTime(submission.submittedAt)}
                  </p>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border/80 p-4 text-sm text-muted-foreground">
                O comprador ainda não enviou observações textuais neste bloco.
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-base font-semibold">Documentos enviados</h3>
            </div>
            {buyerDocuments.length > 0 ? (
              buyerDocuments.map((document) => (
                <article key={document.id} className="rounded-2xl border border-border/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{document.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {documentStatusLabels[document.status]} · v{document.version}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Enviado em {formatDateTime(document.uploadedAt)}
                      </p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => downloadBuyerDocument(document)}>
                      <Download className="mr-2 h-4 w-4" />
                      Baixar
                    </Button>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border/80 p-4 text-sm text-muted-foreground">
                Não há documentos do comprador vinculados a {blockTitleLabels[block.key].toLowerCase()}.
              </div>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
