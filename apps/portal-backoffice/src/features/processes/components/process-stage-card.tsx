import { Button, Label, Select, Textarea } from "@registra/ui";
import { AlertTriangle, CheckCircle2, Eye, Lock } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

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
  completing?: boolean;
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

function selectableStatusesForDocument(
  current: WorkflowProcessDocumentStatus,
): WorkflowProcessDocumentStatus[] {
  switch (current) {
    case "uploaded":
      return ["uploaded", "under_review", "approved", "rejected"];
    case "under_review":
      return ["under_review", "approved", "rejected"];
    default:
      return [current];
  }
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
  completing,
}: ProcessStageCardProps) {
  const [observation, setObservation] = useState("");

  const missingProcess = !stage.process;
  const certificateStage = isCertificateIssuanceStage(stage);
  const documents = stage.process?.documents ?? [];

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
    observation.trim().length > 0;

  const canPressComplete = certificateStage ? certificateCompleteEnabled : genericCompleteEnabled;

  const displayStatus = missingProcess ? "Pendente" : stageStatusLabel(stage.status);

  const shellClassName = missingProcess
    ? "rounded-xl border border-slate-200/80 bg-background p-4 opacity-60 saturate-50 transition-opacity"
    : "rounded-xl border border-slate-200/80 bg-background p-4 transition-opacity";

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

    onCompleteStage(observation.trim());
  };

  return (
    <div className={shellClassName}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <p className="font-medium">
            {stage.order}. {stage.name}
          </p>
          {stage.description ? (
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
        </div>
      </div>

      {certificateStage && !missingProcess ? (
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
                  const canChangeStatus =
                    Boolean(onPatchDocument) &&
                    !busy &&
                    (document.status === "uploaded" || document.status === "under_review");

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
                              disabled={!canChangeStatus || busy}
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

      {!certificateStage && !missingProcess ? (
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

      {!missingProcess ? (
        <div className="mt-4 space-y-2">
          <Label htmlFor={`stage-note-${stage.id}`}>Observação do backoffice</Label>
          <Textarea
            id={`stage-note-${stage.id}`}
            value={observation}
            onChange={(event) => setObservation(event.target.value)}
            placeholder="Registre pareceres, pendências ou contexto para esta etapa."
            rows={3}
            className="resize-y"
          />
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {missingProcess
            ? "Esta etapa ainda não foi iniciada no processo (sem instância vinculada)."
            : certificateStage
              ? "Concluir habilita quando o comprador tem certificado eNotariado e todos os documentos estão aprovados (OpenAPI: status approved)."
              : "Concluir habilita quando a etapa está em andamento e há observação preenchida."}
        </p>
        <Button
          type="button"
          disabled={missingProcess || !canPressComplete || completing}
          onClick={handleComplete}
        >
          {completing ? "Concluindo…" : "Concluir etapa"}
        </Button>
      </div>
    </div>
  );
}
