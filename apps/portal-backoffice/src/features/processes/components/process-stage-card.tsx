import {
  REGISTRATION_BLOCK,
  REGISTRATION_DOCUMENT_TYPE_LABELS,
  REGISTRATION_DOCUMENT_TYPES,
  type RegistrationDocumentType,
} from "@registra/shared";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Input,
  Label,
  Select,
  Textarea,
} from "@registra/ui";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  Lock,
  Save,
  Send,
  UploadCloud,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import type {
  ContractControlStatus,
  ProcessDetailBuyer,
  ProcessStage,
  WorkflowProcessDocumentStatus,
  WorkflowStageDocument,
} from "@/features/processes/core/process-schema";

export type ProcessStageCardProps = {
  stage: ProcessStage;
  buyer: ProcessDetailBuyer | null;
  onPatchDocument?: (input: {
    documentId: string;
    status: WorkflowProcessDocumentStatus;
    comments?: string;
  }) => void;
  onUploadRegistrationDocument?: (input: {
    processId: string;
    type: RegistrationDocumentType;
    file: File;
  }) => void;
  uploadingRegistrationDocumentType?: RegistrationDocumentType | null;
  onPatchDocumentMetadata?: (input: {
    documentId: string;
    deedRegistrationNumber: string | null;
  }) => void;
  patchingDocumentMetadataId?: string | null;
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

function isPropertyRegistrationStage(stage: ProcessStage): boolean {
  if (stage.order === 3) {
    return true;
  }

  return /registro/i.test(stage.name);
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
  { value: "awaiting_document_upload", label: "Aguardando envio do contrato" },
  { value: "awaiting_signature", label: "Aguardando assinatura" },
  { value: "signed", label: "Assinado" },
  { value: "cancelled", label: "Cancelado" },
] as const;

type ContractControlDisplayStatus = ContractControlStatus | "responded" | "under_review";

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

function documentUpdatedTime(document: WorkflowStageDocument): number {
  return new Date(document.updatedAt ?? document.createdAt ?? 0).getTime();
}

function resolveLatestDocument(
  documents: WorkflowStageDocument[],
  type: RegistrationDocumentType,
): WorkflowStageDocument | null {
  return (
    documents
      .filter((document) => document.type === type && document.status !== "replaced")
      .sort((left, right) => {
        if ((left.version ?? 1) !== (right.version ?? 1)) {
          return (right.version ?? 1) - (left.version ?? 1);
        }

        return documentUpdatedTime(right) - documentUpdatedTime(left);
      })[0] ?? null
  );
}

const CONTRACT_CONTROL_STATUS_META: Record<
  ContractControlDisplayStatus,
  {
    label: string;
    variant: "secondary" | "warning" | "success" | "danger";
    description: string;
    nextStep: string;
  }
> = {
  pending_generation: {
    label: "Aguardando envio do contrato",
    variant: "warning",
    description: "O supplier ainda não enviou o contrato para esta etapa.",
    nextStep: "Acompanhar o envio do contrato para iniciar a validação do backoffice.",
  },
  awaiting_document_upload: {
    label: "Aguardando envio do contrato",
    variant: "warning",
    description: "O supplier ainda não enviou o contrato para esta etapa.",
    nextStep: "Acompanhar o envio do contrato para iniciar a validação do backoffice.",
  },
  responded: {
    label: "Respondido",
    variant: "secondary",
    description:
      "O supplier respondeu com arquivos do contrato e o backoffice precisa validar a resposta.",
    nextStep: "Revisar os arquivos enviados para aprovar, reprovar ou solicitar nova resposta.",
  },
  under_review: {
    label: "Em análise",
    variant: "warning",
    description:
      "O backoffice está validando os arquivos enviados pelo supplier antes de liberar a assinatura.",
    nextStep: "Concluir a validação documental para então seguir com a assinatura do contrato.",
  },
  awaiting_signature: {
    label: "Aguardando assinatura",
    variant: "warning",
    description: "O contrato foi recebido e o backoffice segue aguardando o retorno assinado.",
    nextStep: "Validar os arquivos recebidos e acompanhar a assinatura do contrato.",
  },
  signed: {
    label: "Assinado",
    variant: "success",
    description: "O contrato assinado foi confirmado pelo backoffice.",
    nextStep: "Com os arquivos aprovados, a etapa já pode ser concluída.",
  },
  completed: {
    label: "Assinado",
    variant: "success",
    description: "O contrato assinado foi confirmado pelo backoffice.",
    nextStep: "Com os arquivos aprovados, a etapa já pode ser concluída.",
  },
  cancelled: {
    label: "Cancelado",
    variant: "danger",
    description: "O contrato foi cancelado ou inutilizado durante o fluxo.",
    nextStep: "Revisar a pendência operacional antes de avançar a etapa.",
  },
};

function resolveContractControlStatus(
  status: ContractControlStatus | null | undefined,
  documents: WorkflowStageDocument[],
): ContractControlStatus {
  if (status === "signed") {
    return "signed";
  }

  if (status === "completed") {
    return "signed";
  }

  if (status === "cancelled") {
    return "cancelled";
  }

  if (documents.some((document) => document.status === "rejected")) {
    return "awaiting_document_upload";
  }

  if (documents.length === 0) {
    return "awaiting_document_upload";
  }

  if (documents.every((document) => document.status === "approved")) {
    return "awaiting_signature";
  }

  return "awaiting_document_upload";
}

function resolveContractControlDisplayStatus(
  status: ContractControlStatus | null | undefined,
  documents: WorkflowStageDocument[],
): ContractControlDisplayStatus {
  if (status === "signed" || status === "completed") {
    return "signed";
  }

  if (status === "cancelled") {
    return "cancelled";
  }

  if (documents.some((document) => document.status === "under_review")) {
    return "under_review";
  }

  if (
    documents.some((document) => document.status === "uploaded" || document.status === "replaced")
  ) {
    return "responded";
  }

  return resolveContractControlStatus(status, documents);
}

function isContractControlReadyForCompletion(status: ContractControlStatus): boolean {
  return status === "signed";
}

export function ProcessStageCard({
  stage,
  buyer,
  onPatchDocument,
  onUploadRegistrationDocument,
  uploadingRegistrationDocumentType,
  onPatchDocumentMetadata,
  patchingDocumentMetadataId,
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
  const [contractControlStatus, setContractControlStatus] =
    useState<ContractControlStatus>("pending_generation");
  const [deedRegistrationNumber, setDeedRegistrationNumber] = useState("");

  const missingProcess = !stage.process;
  const isCompletedStage = stage.status === "completed";
  const certificateStage = isCertificateIssuanceStage(stage);
  const contractStage = isContractGenerationStage(stage);
  const registrationStage = isPropertyRegistrationStage(stage);
  const documentValidationStage = certificateStage || contractStage || registrationStage;
  const allStageDocuments = stage.process?.documents ?? [];
  const documents = registrationStage
    ? allStageDocuments.filter((document) => document.block === REGISTRATION_BLOCK)
    : allStageDocuments;
  const itbiGuideDocument = registrationStage
    ? resolveLatestDocument(documents, REGISTRATION_DOCUMENT_TYPES.itbiGuide)
    : null;
  const itbiReceiptDocument = registrationStage
    ? resolveLatestDocument(documents, REGISTRATION_DOCUMENT_TYPES.itbiReceipt)
    : null;
  const deedDocument = registrationStage
    ? (resolveLatestDocument(documents, REGISTRATION_DOCUMENT_TYPES.deed) ??
      resolveLatestDocument(documents, REGISTRATION_DOCUMENT_TYPES.registeredDeed))
    : null;
  const itbiReceiptApproved = itbiReceiptDocument?.status === "approved";
  const deedApproved = deedDocument?.status === "approved";
  const persistedDeedRegistrationNumber =
    deedDocument?.metadata?.deedRegistrationNumber?.trim() ?? "";
  const hasDeedRegistrationNumber = persistedDeedRegistrationNumber.length > 0;
  const hasContractDocuments = documents.length > 0;
  const hasRejectedContractDocuments = documents.some((document) => document.status === "rejected");
  const persistedContractControl = stage.process?.contractControl ?? null;
  const persistedContractStatus = resolveContractControlStatus(
    persistedContractControl?.status,
    documents,
  );
  const displayedContractStatus = resolveContractControlDisplayStatus(
    persistedContractControl?.status,
    documents,
  );
  const contractStatusMeta = CONTRACT_CONTROL_STATUS_META[displayedContractStatus];
  const trimmedObservation = observation.trim();
  const canEditContractControl =
    contractStage && !missingProcess && !isCompletedStage && Boolean(onSaveContractControl);
  const hasObservation = trimmedObservation.length > 0;
  const canSendObservation =
    !missingProcess &&
    !isCompletedStage &&
    hasObservation &&
    trimmedObservation !== lastSentObservation &&
    !sendingObservation;
  const isCollapsedCompletedStage = isCompletedStage && !isExpanded;
  const isContractControlDirty = contractControlStatus !== persistedContractStatus;

  const allDocumentsApproved =
    documents.length > 0 && documents.every((document) => document.status === "approved");

  const certificateCompleteEnabled =
    certificateStage &&
    !missingProcess &&
    buyer?.hasEnotariadoCertificate === true &&
    allDocumentsApproved;

  const contractCompleteEnabled =
    contractStage &&
    !missingProcess &&
    allDocumentsApproved &&
    isContractControlReadyForCompletion(persistedContractStatus);

  const registrationCompleteEnabled =
    registrationStage &&
    !missingProcess &&
    itbiReceiptApproved &&
    deedApproved &&
    hasDeedRegistrationNumber;

  const genericCompleteEnabled =
    !documentValidationStage && !missingProcess && stage.status === "in_progress" && hasObservation;

  const canPressComplete = certificateStage
    ? certificateCompleteEnabled
    : contractStage
      ? contractCompleteEnabled
      : registrationStage
        ? registrationCompleteEnabled
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
  }, []);

  useEffect(() => {
    setContractControlStatus(
      resolveContractControlStatus(stage.process?.contractControl?.status, documents),
    );
  }, [documents, stage.process?.contractControl?.status]);

  useEffect(() => {
    setDeedRegistrationNumber(persistedDeedRegistrationNumber);
  }, [persistedDeedRegistrationNumber]);

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

  let contractBanner: ReactNode = null;
  if (contractStage && !missingProcess) {
    const contractOperationalMessage = !hasContractDocuments
      ? "O supplier ainda não enviou o contrato. Mantenha o controle em acompanhamento até o recebimento do arquivo."
      : displayedContractStatus === "signed"
        ? "O contrato assinado foi confirmado. Se os arquivos estiverem aprovados, a etapa já pode ser concluída."
        : hasRejectedContractDocuments
          ? "A validação reprovou ao menos um arquivo. O supplier precisa responder novamente com uma nova versão do contrato."
          : displayedContractStatus === "under_review"
            ? "Os arquivos já entraram em análise do backoffice. Conclua a validação antes de seguir para a assinatura."
            : displayedContractStatus === "responded"
              ? "O supplier respondeu com documentos. O backoffice agora precisa validar essa resposta antes de liberar a assinatura."
              : !allDocumentsApproved
                ? "O contrato foi recebido. O backoffice deve validar os arquivos e aguardar o retorno assinado."
                : "Os arquivos estão aprovados. Agora o backoffice deve aguardar o contrato assinado para liberar a conclusão da etapa.";

    contractBanner = (
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,1fr)]">
        <div className="rounded-lg border border-slate-200/80 bg-slate-50/70 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Envio do contrato
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">Responsável: supplier</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasContractDocuments
              ? `${documents.length} arquivo(s) recebido(s) nesta etapa.`
              : "Nenhum contrato foi enviado ainda para validação do backoffice."}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200/80 bg-slate-50/70 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Controle do backoffice
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant={contractStatusMeta.variant}>{contractStatusMeta.label}</Badge>
            {savingContractControl ? (
              <span className="text-xs font-medium text-amber-700">Salvando...</span>
            ) : isContractControlDirty ? (
              <span className="text-xs font-medium text-amber-700">Alterações pendentes</span>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{contractStatusMeta.description}</p>
        </div>

        <div className="rounded-lg border border-slate-200/80 bg-slate-50/70 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Próximo passo
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">{contractStatusMeta.nextStep}</p>
          <p className="mt-2 text-sm text-muted-foreground">{contractOperationalMessage}</p>
        </div>
      </div>
    );
  }

  let registrationContent: ReactNode = null;
  if (registrationStage && !missingProcess) {
    const canSaveDeedRegistrationNumber =
      Boolean(deedDocument) &&
      !isCompletedStage &&
      Boolean(onPatchDocumentMetadata) &&
      deedRegistrationNumber.trim() !== persistedDeedRegistrationNumber &&
      patchingDocumentMetadataId !== deedDocument?.id;

    const renderDocumentCard = ({
      title,
      description,
      document,
      locked,
      lockedLabel,
      uploadType,
      uploadLabel,
    }: {
      title: string;
      description: string;
      document: WorkflowStageDocument | null;
      locked?: boolean;
      lockedLabel?: string;
      uploadType?: RegistrationDocumentType;
      uploadLabel?: string;
    }) => {
      const busy = document ? patchingDocumentId === document.id : false;
      const viewing = document ? viewingDocumentId === document.id : false;
      const metadataBusy = document ? patchingDocumentMetadataId === document.id : false;
      const statusOptions = document ? selectableStatusesForDocument(document.status) : [];
      const canChangeStatus =
        Boolean(document) && !isCompletedStage && Boolean(onPatchDocument) && !busy;
      const canUpload =
        uploadType &&
        !locked &&
        !isCompletedStage &&
        Boolean(stage.process?.id) &&
        Boolean(onUploadRegistrationDocument) &&
        uploadingRegistrationDocumentType !== uploadType;

      return (
        <article className="rounded-lg border border-border/80 bg-muted/10 p-4 text-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1 space-y-1">
              <p className="font-medium leading-snug">{title}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
              {document ? (
                <p className="text-xs text-muted-foreground">
                  {document.originalFileName ?? "Arquivo sem nome"} · v{document.version ?? 1} ·{" "}
                  {formatFileSize(document.fileSize)}
                </p>
              ) : locked ? (
                <p className="text-xs font-medium text-amber-700">{lockedLabel}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Documento ainda não enviado.</p>
              )}
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-end sm:justify-end lg:w-auto lg:min-w-[min(100%,24rem)]">
              {document ? (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-9 shrink-0 justify-center gap-1.5 px-3"
                    disabled={!onViewDocument || viewing}
                    onClick={() => void onViewDocument?.(document.id)}
                  >
                    <Eye className="h-4 w-4 shrink-0" aria-hidden />
                    {viewing ? "Abrindo..." : "Visualizar"}
                  </Button>

                  <div className="flex min-w-0 flex-1 flex-col gap-1 sm:min-w-[12rem]">
                    <span className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                      Status
                    </span>
                    <Select
                      aria-label={`Status do documento ${title}`}
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
                </>
              ) : canUpload ? (
                <Label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground">
                  <UploadCloud className="h-4 w-4" aria-hidden />
                  {uploadingRegistrationDocumentType === uploadType ? "Enviando..." : uploadLabel}
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="sr-only"
                    disabled={!canUpload || !stage.process?.id}
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0] ?? null;
                      event.currentTarget.value = "";
                      if (
                        !file ||
                        !stage.process?.id ||
                        !uploadType ||
                        !onUploadRegistrationDocument
                      ) {
                        return;
                      }

                      onUploadRegistrationDocument({
                        processId: stage.process.id,
                        type: uploadType,
                        file,
                      });
                    }}
                  />
                </Label>
              ) : null}
            </div>
          </div>

          {busy ? (
            <p className="mt-2 text-xs text-muted-foreground">A atualizar status...</p>
          ) : null}

          {document?.id === deedDocument?.id ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <div className="space-y-1.5">
                <Label htmlFor={`deed-registration-number-${stage.id}`}>Matrícula registrada</Label>
                <Input
                  id={`deed-registration-number-${stage.id}`}
                  value={deedRegistrationNumber}
                  placeholder="Informe a matrícula da escritura"
                  disabled={!deedDocument || isCompletedStage || metadataBusy}
                  onChange={(event) => setDeedRegistrationNumber(event.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={!canSaveDeedRegistrationNumber || metadataBusy}
                onClick={() => {
                  if (!deedDocument || !onPatchDocumentMetadata) {
                    return;
                  }

                  onPatchDocumentMetadata({
                    documentId: deedDocument.id,
                    deedRegistrationNumber: deedRegistrationNumber.trim() || null,
                  });
                }}
              >
                <Save className="h-4 w-4" aria-hidden />
                {metadataBusy ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          ) : null}
        </article>
      );
    };

    registrationContent = (
      <div className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-3">
          <div className="rounded-lg border border-slate-200/80 bg-slate-50/70 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Guia de ITBI
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              O backoffice emite e envia a guia para liberar o comprovante ao comprador.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200/80 bg-slate-50/70 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Comprovante ITBI
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              O comprador envia o comprovante e o backoffice aprova ou reprova a validação.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200/80 bg-slate-50/70 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Escritura
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              A escritura só libera conclusão com documento aprovado e matrícula registrada.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {renderDocumentCard({
            title: REGISTRATION_DOCUMENT_TYPE_LABELS.itbi_guide,
            description: "Documento emitido pelo backoffice para pagamento do ITBI.",
            document: itbiGuideDocument,
            uploadType: REGISTRATION_DOCUMENT_TYPES.itbiGuide,
            uploadLabel: "Enviar guia",
          })}

          {renderDocumentCard({
            title: REGISTRATION_DOCUMENT_TYPE_LABELS.itbi_receipt,
            description: "Comprovante de pagamento enviado pelo comprador.",
            document: itbiReceiptDocument,
            locked: !itbiGuideDocument,
            lockedLabel: "Aguardando envio da guia de ITBI.",
          })}

          {renderDocumentCard({
            title: REGISTRATION_DOCUMENT_TYPE_LABELS.deed,
            description: "Escritura enviada pelo comprador após aprovação do comprovante ITBI.",
            document: deedDocument,
            locked: !itbiReceiptApproved,
            lockedLabel: "Aguardando aprovação do comprovante ITBI.",
          })}
        </div>
      </div>
    );
  }

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

  const handleContractControlChange = async (nextStatus: ContractControlStatus) => {
    setContractControlStatus(nextStatus);

    if (
      nextStatus === persistedContractStatus ||
      !canEditContractControl ||
      savingContractControl ||
      !onSaveContractControl ||
      !stage.process
    ) {
      return;
    }

    await onSaveContractControl({
      processId: stage.process.id,
      stageId: stage.id,
      signatureUrl: persistedContractControl?.signatureUrl ?? null,
      contractControlStatus: nextStatus,
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
          {registrationStage ? registrationContent : null}

          {contractStage ? (
            <div className="space-y-3 rounded-lg border border-border/80 bg-muted/10 p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Acompanhamento contratual</p>
                <p className="text-xs text-muted-foreground">
                  Sem contrato enviado, o status fica em aguardando envio. Ao mudar o status do
                  controle, o backoffice salva automaticamente e só libera a etapa quando marcar
                  como assinado.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`contract-control-status-${stage.id}`}>Status do controle</Label>
                <Select
                  id={`contract-control-status-${stage.id}`}
                  value={contractControlStatus}
                  disabled={!canEditContractControl || savingContractControl}
                  onChange={(event) => {
                    void handleContractControlChange(event.target.value as ContractControlStatus);
                  }}
                >
                  {CONTRACT_CONTROL_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="rounded-md border border-dashed border-amber-300/80 bg-background p-3 text-xs text-muted-foreground">
                <p>
                  {persistedContractControl?.updatedAt
                    ? `Última atualização em ${new Date(persistedContractControl.updatedAt).toLocaleString("pt-BR")}${
                        persistedContractControl.updatedBy?.name
                          ? ` por ${persistedContractControl.updatedBy.name}`
                          : ""
                      }.`
                    : "Sem documento enviado: aguardando envio. Com documento recebido: aguarde a validação e depois marque como assinado para habilitar a conclusão da etapa."}
                </p>
              </div>
            </div>
          ) : null}

          {!registrationStage ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {contractStage ? "Contrato e anexos para análise" : "Documentos para análise"}
              </p>
              {documents.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  {contractStage
                    ? "Aguardando o supplier enviar o contrato para que o backoffice possa analisar os arquivos."
                    : "Nenhum documento vinculado a esta etapa."}
                </p>
              ) : (
                <ul className="space-y-3">
                  {documents.map((document) => {
                    const busy = patchingDocumentId === document.id;
                    const viewing = viewingDocumentId === document.id;
                    const statusOptions = selectableStatusesForDocument(document.status);
                    const canChangeStatus = !isCompletedStage && Boolean(onPatchDocument) && !busy;

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
                    <li
                      key={note.id}
                      className="rounded-md border border-border/60 bg-background p-3"
                    >
                      <p className="text-sm text-foreground">{note.note}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {note.createdBy?.name ?? "Backoffice"}{" "}
                        {note.createdAt
                          ? `• ${new Date(note.createdAt).toLocaleString("pt-BR")}`
                          : ""}
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
                  ? "Concluir habilita quando os arquivos do contrato estão aprovados e o status salvo do contrato está como assinado."
                  : registrationStage
                    ? "Concluir habilita quando comprovante ITBI e escritura estão aprovados, com matrícula registrada preenchida."
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
