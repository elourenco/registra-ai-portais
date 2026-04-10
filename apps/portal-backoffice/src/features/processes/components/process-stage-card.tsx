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
  Input,
  Label,
  Select,
  Textarea,
} from "@registra/ui";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Eye, Lock, Send } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import type {
  ContractControlStatus,
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
  onSendObservation?: (observation: string) => Promise<void>;
  onSaveContractControl?: (input: {
    processId: string;
    stageId: string;
    signatureUrl: string | null;
    contractControlStatus: ContractControlStatus;
  }) => Promise<void>;
  savingContractControl?: boolean;
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

function isContractGenerationStage(stage: ProcessStage): boolean {
  if (stage.order === 2) {
    return true;
  }

  return /contrat/i.test(stage.name);
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

const CONTRACT_CONTROL_STATUS_OPTIONS: Array<{ value: ContractControlStatus; label: string }> = [
  { value: "pending_generation", label: "Pendente de geração" },
  { value: "awaiting_document_upload", label: "Aguardando envio do contrato" },
  { value: "awaiting_signature", label: "Aguardando assinatura" },
  { value: "signed", label: "Assinado" },
  { value: "completed", label: "Concluído" },
  { value: "cancelled", label: "Cancelado" },
] as const;

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

function isValidAbsoluteUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
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
  onSaveContractControl,
  savingContractControl,
  completing,
  sendingObservation,
}: ProcessStageCardProps) {
  const [observation, setObservation] = useState("");
  const [isExpanded, setIsExpanded] = useState(stage.status !== "completed");
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [lastSentObservation, setLastSentObservation] = useState<string | null>(null);
  const [contractSignatureUrl, setContractSignatureUrl] = useState("");
  const [contractControlStatus, setContractControlStatus] =
    useState<ContractControlStatus>("pending_generation");

  const missingProcess = !stage.process;
  const isCompletedStage = stage.status === "completed";
  const certificateStage = isCertificateIssuanceStage(stage);
  const contractStage = isContractGenerationStage(stage);
  const documentValidationStage = certificateStage || contractStage;
  const documents = stage.process?.documents ?? [];
  const persistedContractControl = stage.process?.contractControl ?? null;
  const trimmedObservation = observation.trim();
  const trimmedContractSignatureUrl = contractSignatureUrl.trim();
  const hasValidContractSignatureUrl =
    trimmedContractSignatureUrl.length === 0 || isValidAbsoluteUrl(trimmedContractSignatureUrl);
  const hasObservation = trimmedObservation.length > 0;
  const canSendObservation =
    !missingProcess &&
    !isCompletedStage &&
    hasObservation &&
    trimmedObservation !== lastSentObservation &&
    !sendingObservation;
  const isCollapsedCompletedStage = isCompletedStage && !isExpanded;
  const canSaveContractControl =
    contractStage &&
    !missingProcess &&
    Boolean(onSaveContractControl) &&
    !savingContractControl &&
    hasValidContractSignatureUrl &&
    (trimmedContractSignatureUrl !== (persistedContractControl?.signatureUrl ?? "") ||
      contractControlStatus !== (persistedContractControl?.status ?? "pending_generation"));

  const allDocumentsApproved =
    documents.length > 0 && documents.every((document) => document.status === "approved");

  const certificateCompleteEnabled =
    certificateStage &&
    !missingProcess &&
    buyer?.hasEnotariadoCertificate === true &&
    allDocumentsApproved;

  const contractCompleteEnabled = contractStage && !missingProcess && allDocumentsApproved;

  const genericCompleteEnabled =
    !documentValidationStage &&
    !missingProcess &&
    stage.status === "in_progress" &&
    hasObservation;

  const canPressComplete = certificateStage
    ? certificateCompleteEnabled
    : contractStage
      ? contractCompleteEnabled
      : genericCompleteEnabled;

  const displayStatus = missingProcess ? "Pendente" : stageStatusLabel(stage.status);

  const shellClassName = missingProcess
    ? "rounded-xl border border-slate-200/80 bg-background p-4 opacity-60 saturate-50 transition-opacity"
    : "rounded-xl border border-slate-200/80 bg-background p-4 transition-opacity";

  useEffect(() => {
    if (isCompletedStage) {
      setIsExpanded(false);
      return;
    }

    setIsExpanded(true);
  }, [isCompletedStage]);

  useEffect(() => {
    setLastSentObservation(null);
    setObservation("");
    setContractSignatureUrl(stage.process?.contractControl?.signatureUrl ?? "");
    setContractControlStatus(stage.process?.contractControl?.status ?? "pending_generation");
  }, [stage.id]);

  useEffect(() => {
    setContractSignatureUrl(stage.process?.contractControl?.signatureUrl ?? "");
    setContractControlStatus(stage.process?.contractControl?.status ?? "pending_generation");
  }, [stage.process?.contractControl?.signatureUrl, stage.process?.contractControl?.status]);

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

  const contractBanner: ReactNode = null;

  const handleComplete = () => {
    if (!canPressComplete || !onCompleteStage) {
      return;
    }

    setIsConfirmDialogOpen(false);
    onCompleteStage(trimmedObservation === lastSentObservation ? "" : trimmedObservation);
  };

  const handleSendObservation = async () => {
    if (!canSendObservation || !onSendObservation) {
      return;
    }

    await onSendObservation(trimmedObservation);
    setLastSentObservation(trimmedObservation);
  };

  const handleSaveContractControl = async () => {
    if (!canSaveContractControl || !onSaveContractControl || !stage.process) {
      return;
    }

    await onSaveContractControl({
      processId: stage.process.id,
      stageId: stage.id,
      signatureUrl: trimmedContractSignatureUrl || null,
      contractControlStatus,
    });
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
          {isCompletedStage ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              aria-label={isExpanded ? "Recolher etapa" : "Expandir etapa"}
              title={isExpanded ? "Recolher etapa" : "Expandir etapa"}
              onClick={() => setIsExpanded((current) => !current)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" aria-hidden />
              ) : (
                <ChevronDown className="h-4 w-4" aria-hidden />
              )}
            </Button>
          ) : null}
        </div>
      </div>

      {!isCollapsedCompletedStage && documentValidationStage && !missingProcess ? (
        <div className="mt-4 space-y-4">
          {certificateStage ? enotariadoBanner : null}
          {contractStage ? contractBanner : null}

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
                    !isCompletedStage && Boolean(onPatchDocument) && !busy;

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

          {contractStage ? (
            <div className="space-y-3 rounded-lg border border-border/80 bg-muted/10 p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Controle do contrato</p>
                <p className="text-xs text-muted-foreground">
                  O backoffice aguarda o documento do contrato e acompanha a assinatura por aqui.
                </p>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`contract-signature-url-${stage.id}`}>URL do contrato para assinatura</Label>
                  <Input
                    id={`contract-signature-url-${stage.id}`}
                    value={contractSignatureUrl}
                    onChange={(event) => setContractSignatureUrl(event.target.value)}
                    placeholder="https://assinatura.parceira.com/contrato/123"
                  />
                  {!hasValidContractSignatureUrl ? (
                    <p className="text-xs text-rose-700">Informe uma URL absoluta iniciando com http:// ou https://.</p>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`contract-control-status-${stage.id}`}>Status do contrato</Label>
                  <Select
                    id={`contract-control-status-${stage.id}`}
                    value={contractControlStatus}
                    onChange={(event) =>
                      setContractControlStatus(event.target.value as ContractControlStatus)
                    }
                  >
                    {CONTRACT_CONTROL_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-2 rounded-md border border-dashed border-amber-300/80 bg-background p-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <p>
                  {persistedContractControl?.updatedAt
                    ? `Última atualização em ${new Date(persistedContractControl.updatedAt).toLocaleString("pt-BR")}${
                        persistedContractControl.updatedBy?.name
                          ? ` por ${persistedContractControl.updatedBy.name}`
                          : ""
                      }.`
                    : "Preencha a URL de assinatura e o status operacional do contrato."}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!canSaveContractControl}
                  onClick={() => void handleSaveContractControl()}
                >
                  {savingContractControl ? "Salvando..." : "Salvar controle do contrato"}
                </Button>
              </div>
            </div>
          ) : null}
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
              disabled={isCompletedStage}
            />
            {hasObservation && !isCompletedStage ? (
              <Button
                type="button"
                variant="outline"
                className="sm:mt-0 sm:self-stretch"
                disabled={!canSendObservation}
                onClick={() => void handleSendObservation()}
              >
                <Send className="h-4 w-4" aria-hidden />
                {sendingObservation
                  ? "Enviando..."
                  : trimmedObservation === lastSentObservation
                    ? "Enviada"
                    : "Enviar"}
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
                : contractStage
                  ? "Concluir habilita quando o documento do contrato foi enviado e todos os arquivos da etapa estão aprovados."
                : "Concluir habilita quando a etapa está em andamento e há observação preenchida."}
          </p>
          {isCompletedStage ? null : (
            <Button
              type="button"
              disabled={missingProcess || !canPressComplete || completing}
              onClick={() => setIsConfirmDialogOpen(true)}
            >
              {completing ? "Concluindo…" : "Concluir etapa"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
