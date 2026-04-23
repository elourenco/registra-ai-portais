import {
  type BuyerProcessDocument,
  REGISTRATION_BLOCK,
  REGISTRATION_DOCUMENT_TYPES,
} from "@registra/shared";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CircleCheckBigIcon,
  CircleDotIcon,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Progress,
  UploadCloudIcon,
} from "@registra/ui";
import { useState } from "react";

import type {
  BuyerProcessTrackerTimelineStage,
  BuyerProcessTrackerViewModel,
} from "../core/buyer-process-tracker-view-model";

interface StatusTrackerCardProps extends BuyerProcessTrackerViewModel {
  isRefreshing: boolean;
  refreshErrorMessage: string | null;
  onResolveNow: () => void;
  onUploadDocument: (document: BuyerProcessDocument, file: File) => Promise<void>;
  uploadingDocumentId?: string | null;
  uploadErrorMessage?: string | null;
}

const topStatusMap = {
  in_progress: { label: "Em andamento", variant: "outline" as const },
  in_review: { label: "Em análise", variant: "secondary" as const },
  waiting_user: { label: "Aguardando você", variant: "warning" as const },
  completed: { label: "Concluído", variant: "success" as const },
};

function DocumentStatusBadge({ status }: { status: BuyerProcessDocument["status"] }) {
  switch (status) {
    case "approved":
      return <Badge variant="success">Aprovado</Badge>;
    case "rejected":
      return <Badge variant="danger">Reprovado</Badge>;
    case "under_review":
      return <Badge variant="secondary">Em análise</Badge>;
    case "replaced":
      return <Badge variant="outline">Substituído</Badge>;
    case "uploaded":
      return <Badge variant="outline">Enviado</Badge>;
    default:
      return <Badge variant="outline">Pendente</Badge>;
  }
}

function DocumentActionModal({
  document,
  onResolveNow,
  onUploadDocument,
  uploading,
}: {
  document: BuyerProcessDocument;
  onResolveNow: () => void;
  onUploadDocument: (document: BuyerProcessDocument, file: File) => Promise<void>;
  uploading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const canUploadInline = Boolean(document.block && document.type);

  const handleUpload = async () => {
    if (!file) {
      return;
    }

    if (!canUploadInline) {
      onResolveNow();
      setOpen(false);
      return;
    }

    await onUploadDocument(document, file);
    setFile(null);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="w-full sm:w-auto shrink-0">
          <UploadCloudIcon className="mr-2 h-4 w-4" />
          {document.status === "replaced" ? "Substituir" : "Enviar Novamente"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar documento</DialogTitle>
          <DialogDescription>Selecione o arquivo para {document.title}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="file">Arquivo</Label>
            <Input id="file" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={() => void handleUpload()} disabled={!file || uploading}>
            {uploading ? "Enviando..." : "Enviar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function isRegistrationStage(stage: BuyerProcessTrackerTimelineStage) {
  return stage.id === "registration" || /registro/i.test(stage.title);
}

function documentBelongsToStage(
  document: BuyerProcessDocument,
  stage: BuyerProcessTrackerTimelineStage,
  index: number,
) {
  if (document.stageId && document.stageId === stage.id) {
    return true;
  }

  if (document.stageTitle && document.stageTitle === stage.title) {
    return true;
  }

  if (isRegistrationStage(stage)) {
    return document.block === REGISTRATION_BLOCK;
  }

  if (index === 0) {
    return !document.stageId && !document.stageTitle && document.block !== REGISTRATION_BLOCK;
  }

  return false;
}

function canShowUploadAction(document: BuyerProcessDocument) {
  if (document.status === "approved" || document.status === "under_review") {
    return false;
  }

  if (document.block !== REGISTRATION_BLOCK) {
    return true;
  }

  return (
    document.type === REGISTRATION_DOCUMENT_TYPES.itbiReceipt ||
    document.type === REGISTRATION_DOCUMENT_TYPES.deed
  );
}

export function StatusTrackerCard({
  status,
  timeline,
  documents,
  pendingAction,
  hasEnotariadoCertificate,
  isRefreshing,
  refreshErrorMessage,
  onResolveNow,
  onUploadDocument,
  uploadingDocumentId,
  uploadErrorMessage,
}: StatusTrackerCardProps) {
  const topStatus = topStatusMap[status];

  const totalStages = timeline.length || 1;
  const completedStagesCount = timeline.filter((s) => s.status === "completed").length;
  const progressValue = (completedStagesCount / totalStages) * 100;

  return (
    <div className="space-y-6">
      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Badge variant={topStatus.variant}>{topStatus.label}</Badge>
            <p className="text-sm text-muted-foreground">
              {isRefreshing ? "Atualizando andamento..." : "Acompanhamento do seu processo"}
            </p>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-xl">
              Informações e documentação enviadas com sucesso
            </CardTitle>
            <CardDescription>
              {pendingAction
                ? "Há uma pendência sua para o processo seguir em frente."
                : status === "completed"
                  ? "Seu processo foi concluído com sucesso."
                  : "Estamos cuidando do seu processo e atualizaremos cada avanço por aqui."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-foreground">
            {pendingAction
              ? "Falta apenas 1 passo para concluir a etapa atual."
              : status === "in_review"
                ? "Seu processo está em análise."
                : "A jornada segue normalmente sem ação sua neste momento."}
          </div>
          {refreshErrorMessage ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {refreshErrorMessage}
            </div>
          ) : null}
          {uploadErrorMessage ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              {uploadErrorMessage}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="space-y-2 mb-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">Avanço do processo</span>
          <span className="text-muted-foreground">{Math.round(progressValue)}%</span>
        </div>
        <Progress value={progressValue} className="h-2 bg-muted" />
      </div>

      <div className="space-y-4">
        {timeline.map((stage, index) => {
          const stageDocuments = documents.filter((document) =>
            documentBelongsToStage(document, stage, index),
          );
          const displayStatus =
            stage.status === "completed"
              ? "Concluído"
              : stage.status === "in_progress"
                ? "Em andamento"
                : "Pendente";

          return (
            <div
              key={stage.id}
              className="rounded-xl border border-slate-200/80 bg-background p-5 shadow-sm transition-opacity"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-base text-foreground">
                    {index + 1}. {stage.title}
                  </p>
                  {stage.description ? (
                    <p className="text-sm text-muted-foreground">{stage.description}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <p className="text-sm text-muted-foreground font-medium">{displayStatus}</p>
                </div>
              </div>

              {(index === 0 || stageDocuments.length > 0 || isRegistrationStage(stage)) && (
                <div className="mt-6 space-y-6">
                  {index === 0 ? (
                    hasEnotariadoCertificate ? (
                      <div className="flex gap-3 rounded-lg border border-emerald-200/80 bg-emerald-50/80 p-3 text-sm text-emerald-900">
                        <CircleCheckBigIcon
                          className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                          aria-hidden
                        />
                        <div>
                          <p className="font-medium">Certificado eNotariado confirmado</p>
                          <p className="text-emerald-800/90">
                            O comprador possui certificado eNotariado registrado neste processo.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3 rounded-lg border border-amber-200/80 bg-amber-50/80 p-3 text-sm text-amber-950">
                        <CircleDotIcon
                          className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
                          aria-hidden
                        />
                        <div>
                          <p className="font-medium">Atenção: certificado eNotariado</p>
                          <p className="text-amber-900/90">
                            O comprador ainda não possui certificado eNotariado.
                          </p>
                        </div>
                      </div>
                    )
                  ) : null}

                  <div className="space-y-3">
                    <p className="text-sm font-medium">Documentos para análise</p>
                    {stageDocuments.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-border/80 p-4 text-sm text-muted-foreground text-center">
                        Nenhum documento vinculado a esta etapa.
                      </p>
                    ) : (
                      <ul className="space-y-3">
                        {stageDocuments.map((doc) => (
                          <li
                            key={doc.id}
                            className="rounded-lg border border-border/80 bg-muted/10 p-4 text-sm"
                          >
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
                              <div className="min-w-0 flex-1 space-y-1">
                                <p className="font-medium leading-snug">{doc.type || doc.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {doc.createdAt
                                    ? `Enviado em ${new Date(doc.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}`
                                    : "Data de envio não informada"}
                                </p>
                              </div>

                              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end lg:w-auto lg:min-w-[min(100%,22rem)] lg:flex-none">
                                {canShowUploadAction(doc) && (
                                  <DocumentActionModal
                                    document={doc}
                                    onResolveNow={onResolveNow}
                                    onUploadDocument={onUploadDocument}
                                    uploading={uploadingDocumentId === doc.id}
                                  />
                                )}

                                <div className="flex min-w-0 flex-col gap-1 items-start sm:items-end sm:min-w-[10rem]">
                                  <span className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                                    Status da validação
                                  </span>
                                  <div className="flex h-9 items-center justify-start sm:justify-end w-full">
                                    <DocumentStatusBadge status={doc.status} />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {doc.rejectionReason && doc.status === "rejected" && (
                              <p className="mt-3 rounded border border-destructive/20 bg-destructive/5 p-2 text-xs text-destructive font-medium">
                                {doc.rejectionReason}
                              </p>
                            )}
                            {doc.metadata?.deedRegistrationNumber ? (
                              <p className="mt-3 rounded border border-emerald-200 bg-emerald-50 p-2 text-xs font-medium text-emerald-800">
                                Matrícula registrada: {doc.metadata.deedRegistrationNumber}
                              </p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
