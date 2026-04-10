import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Label,
  Select,
  Textarea,
} from "@registra/ui";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Eye, Lock, Send } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import type {
  ProcessDetailBuyer,
  ProcessStage,
  WorkflowProcessDocumentStatus,
} from "@/features/processes/core/process-schema";

export type ProcessStageCardProps = {
  stage: ProcessStage;
  buyer: ProcessDetailBuyer | null;
  onPatchDocument?: (input: {
    documentId: string;
    status: WorkflowProcessDocumentStatus;
    comments?: string;
  }) => void;
  patchingDocumentId?: string | null;
  /** Abre o ficheiro num novo separador (download autenticado). */
  onViewDocument?: (documentId: string) => void | Promise<void>;
  viewingDocumentId?: string | null;
  onCompleteStage?: (observation: string) => void;
  onSendObservation?: (observation: string) => void | Promise<void>;
  completing?: boolean;
  sendingObservation?: boolean;
};

function stageStatusLabel(status: ProcessStage["status"]): string {
  switch (status) {
    case "completed":
      return "Concluída";
    case "in_progress":
      return "Em andamento";
    default:
      return "Pendente";
  }
}

function isCertificateIssuanceStage(stage: ProcessStage): boolean {
  if (stage.order === 1) {
    return true;
  }

  return /certificado/i.test(stage.name);
}

const WORKFLOW_DOCUMENT_STATUS_LABEL: Record<WorkflowProcessDocumentStatus, string> = {
  uploaded: "Enviado",
  under_review: "Em análise",
  approved: "Aprovado",
  rejected: "Reprovado",
  replaced: "Substituído",
};

const WORKFLOW_DOCUMENT_STATUS_OPTIONS: WorkflowProcessDocumentStatus[] = [
  "uploaded",
  "under_review",
  "approved",
  "rejected",
  "replaced",
];

function selectableStatusesForDocument(
  current: WorkflowProcessDocumentStatus,
): WorkflowProcessDocumentStatus[] {
  return WORKFLOW_DOCUMENT_STATUS_OPTIONS.includes(current)
    ? WORKFLOW_DOCUMENT_STATUS_OPTIONS
    : [current, ...WORKFLOW_DOCUMENT_STATUS_OPTIONS];
}

function formatFileSize(bytes: number | undefined): string {
  if (bytes === undefined || bytes <= 0) {
    return "—";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb >= 10 ? Math.round(kb) : kb.toFixed(1)} KB`;
  }

  const mb = kb / 1024;
  return `${mb >= 10 ? Math.round(mb) : mb.toFixed(1)} MB`;
}

export function ProcessStageCard({
  stage,
  buyer,
  onPatchDocument,
  patchingDocumentId,
  onViewDocument,
  viewingDocumentId,
  onCompleteStage,
  onSendObservation,
  completing,
  sendingObservation,
}: ProcessStageCardProps) {
  const [observation, setObservation] = useState("");
  const [isExpanded, setIsExpanded] = useState(stage.status !== "completed");
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const missingProcess = !stage.process;
  const certificateStage = isCertificateIssuanceStage(stage);
  const documents = stage.process?.documents ?? [];
  const hasObservation = observation.trim().length > 0;
  const canSendObservation = !missingProcess && hasObservation && !sendingObservation;
  const isCollapsedCompletedStage = stage.status === "completed" && !isExpanded;

  const allDocumentsApproved =
    documents.length > 0 && documents.every((document) => document.status === "approved");

  const certificateCompleteEnabled =
    certificateStage &&
    !missingProcess &&
    buyer?.hasEnotariadoCertificate === true &&
    allDocumentsApproved;

  const genericCompleteEnabled =
    !certificateStage &&
    !missingProcess &&
    stage.status === "in_progress" &&
    hasObservation;

  const canPressComplete = certificateStage ? certificateCompleteEnabled : genericCompleteEnabled;

  const displayStatus = missingProcess ? "Pendente" : stageStatusLabel(stage.status);

  const shellClassName = missingProcess
    ? "rounded-xl border border-slate-200/80 bg-background p-4 opacity-60 saturate-50 transition-opacity"
    : "rounded-xl border border-slate-200/80 bg-background p-4 transition-opacity";

  useEffect(() => {
    if (stage.status === "completed") {
      setIsExpanded(false);
      return;
    }

    setIsExpanded(true);
  }, [stage.status]);

  let enotariadoBanner: ReactNode = null;
  if (certificateStage && !missingProcess) {
    if (buyer?.hasEnotariadoCertificate === true) {
      enotariadoBanner = (
        <div className="flex gap-3 rounded-lg border border-emerald-200/80 bg-emerald-50/80 p-3 text-sm text-emerald-900">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
          <div>
            <p className="font-medium">Certificado eNotariado confirmado</p>
            <p className="text-emerald-800/90">
              O comprador possui certificado eNotariado registrado neste processo.
            </p>
          </div>
        </div>
      );
    } else {
      enotariadoBanner = (
        <div className="flex gap-3 rounded-lg border border-amber-200/80 bg-amber-50/80 p-3 text-sm text-amber-950">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
          <div>
            <p className="font-medium">Atenção: certificado eNotariado</p>
            <p className="text-amber-900/90">
              {buyer?.hasEnotariadoCertificate === false
                ? "O comprador ainda não possui certificado eNotariado. Regularize antes de concluir esta etapa."
                : "Confirme na API se o comprador possui certificado eNotariado (hasEnotariadoCertificate)."}
            </p>
          </div>
        </div>
      );
    }
  }

  const handleComplete = () => {
    if (!canPressComplete || !onCompleteStage) {
      return;
    }

    setIsConfirmDialogOpen(false);
    onCompleteStage(observation.trim());
  };

  const handleSendObservation = () => {
    if (!canSendObservation || !onSendObservation) {
      return;
    }

    void onSendObservation(observation.trim());
  };

  return (
    <div className={shellClassName}>
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar conclusão da etapa?</AlertDialogTitle>
            <AlertDialogDescription>
              A etapa atual será concluída e o processo será avançado para a próxima etapa do
              workflow.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={completing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={completing} onClick={handleComplete}>
              {completing ? "Concluindo..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <p className="font-medium">
            {stage.order}. {stage.name}
          </p>
          {isCollapsedCompletedStage ? (
            <p className="text-sm text-muted-foreground">{displayStatus}</p>
          ) : stage.description ? (
            <p className="text-sm text-muted-foreground">{stage.description}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          {missingProcess ? (
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
              <Lock className="h-3.5 w-3.5" aria-hidden />
              {displayStatus}
            </span>
          ) : (
            <p className="text-sm text-muted-foreground">{displayStatus}</p>
          )}
          {stage.status === "completed" ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setIsExpanded((current) => !current)}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" aria-hidden />
                  Recolher
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" aria-hidden />
                  Expandir
                </>
              )}
            </Button>
          ) : null}
        </div>
      </div>

      {!isCollapsedCompletedStage && certificateStage && !missingProcess ? (
        <div className="mt-4 space-y-4">
          {enotariadoBanner}

          <div className="space-y-2">
            <p className="text-sm font-medium">Documentos para análise</p>
            {documents.length === 0 ? (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Nenhum documento vinculado a esta etapa.
              </p>
            ) : (
              <ul className="space-y-3">
                {documents.map((document) => {
                  const busy = patchingDocumentId === document.id;
                  const viewing = viewingDocumentId === document.id;
                  const statusOptions = selectableStatusesForDocument(document.status);
                  const canChangeStatus = Boolean(onPatchDocument) && !busy;

                  return (
                    <li
                      key={document.id}
                      className="rounded-lg border border-border/80 bg-muted/10 p-3 text-sm"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="font-medium leading-snug">{document.type}</p>
                          <p className="text-xs text-muted-foreground">
                            {document.originalFileName ?? "Arquivo sem nome"} ·{" "}
                            {formatFileSize(document.fileSize)}
                          </p>
                        </div>

                        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-start sm:justify-end lg:w-auto lg:min-w-[min(100%,20rem)] lg:flex-none">
                          <div className="flex shrink-0 flex-col gap-1">
                            <span
                              className="text-[0.65rem] font-medium uppercase tracking-wide text-transparent select-none"
                              aria-hidden
                            >
                              Status da validação
                            </span>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-9 shrink-0 justify-center gap-1.5 px-3 sm:justify-start"
                              disabled={!onViewDocument || viewing}
                              title="Abre o ficheiro num novo separador"
                              onClick={() => void onViewDocument?.(document.id)}
                            >
                              <Eye className="h-4 w-4 shrink-0" aria-hidden />
                              {viewing ? "Abrindo…" : "Visualizar"}
                            </Button>
                          </div>

                          <div className="flex min-w-0 flex-1 flex-col gap-1 sm:min-w-[12rem]">
                            <span className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                              Status da validação
                            </span>
                            <Select
                              aria-label={`Status do documento ${document.type}`}
                              className="h-9 w-full min-w-0 bg-background text-left text-sm"
                              value={document.status}
                              disabled={!canChangeStatus}
                              onChange={(event) => {
                                const next = event.target.value as WorkflowProcessDocumentStatus;
                                if (next === document.status || !onPatchDocument) {
                                  return;
                                }

                                onPatchDocument({
                                  documentId: document.id,
                                  status: next,
                                  comments: observation.trim() || undefined,
                                });
                              }}
                            >
                              {statusOptions.map((value) => (
                                <option key={value} value={value}>
                                  {WORKFLOW_DOCUMENT_STATUS_LABEL[value]}
                                </option>
                              ))}
                            </Select>
                          </div>
                        </div>
                      </div>

                      {busy ? (
                        <p className="mt-2 text-xs text-muted-foreground">A atualizar status…</p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      {!isCollapsedCompletedStage && !certificateStage && !missingProcess ? (
        <div className="mt-4 rounded-lg border border-border/70 bg-muted/5 p-3 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Instância do processo</p>
          <p className="mt-1">
            {stage.process?.name ?? `Processo #${stage.process?.id}`} ·{" "}
            {documents.length} documento(s) nesta etapa.
          </p>
          <p className="mt-2 text-xs">
            Controles específicos desta etapa serão adicionados conforme a regra de negócio. Use a
            observação abaixo e conclua quando o backoffice finalizar a checagem.
          </p>
        </div>
      ) : null}

      {!isCollapsedCompletedStage && !missingProcess ? (
        <div className="mt-4 space-y-2">
          <Label htmlFor={`stage-note-${stage.id}`}>Observação do backoffice</Label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <Textarea
              id={`stage-note-${stage.id}`}
              value={observation}
              onChange={(event) => setObservation(event.target.value)}
              placeholder="Registre pareceres, pendências ou contexto para esta etapa."
              rows={3}
              className="resize-y"
            />
            {hasObservation ? (
              <Button
                type="button"
                variant="outline"
                className="sm:mt-0 sm:self-stretch"
                disabled={!canSendObservation}
                onClick={handleSendObservation}
              >
                <Send className="h-4 w-4" aria-hidden />
                {sendingObservation ? "Enviando..." : "Enviar"}
              </Button>
            ) : null}
          </div>
          {stage.notes.length > 0 ? (
            <div className="space-y-2 rounded-lg border border-border/70 bg-muted/5 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Observações registradas
              </p>
              <ul className="space-y-2">
                {stage.notes
                  .slice()
                  .sort((left, right) => {
                    const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
                    const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
                    return rightTime - leftTime;
                  })
                  .map((note) => (
                    <li key={note.id} className="rounded-md border border-border/60 bg-background p-3">
                      <p className="text-sm text-foreground">{note.note}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {note.createdBy?.name ?? "Backoffice"}{" "}
                        {note.createdAt ? `• ${new Date(note.createdAt).toLocaleString("pt-BR")}` : ""}
                      </p>
                    </li>
                  ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {isCollapsedCompletedStage ? null : (
        <div className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {missingProcess
              ? "Esta etapa ainda não foi iniciada no processo."
              : certificateStage
                ? "Concluir habilita quando o comprador tem certificado eNotariado e todos os documentos estão aprovados."
                : "Concluir habilita quando a etapa está em andamento e há observação preenchida."}
          </p>
          <Button
            type="button"
            disabled={missingProcess || !canPressComplete || completing}
            onClick={() => setIsConfirmDialogOpen(true)}
          >
            {completing ? "Concluindo…" : "Concluir etapa"}
          </Button>
        </div>
      )}
    </div>
  );
}
