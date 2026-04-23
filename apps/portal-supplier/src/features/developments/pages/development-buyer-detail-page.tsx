import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EyeIcon,
  FileTextIcon,
  GitBranchIcon,
  Input,
  Separator,
  Skeleton,
  useToast,
} from "@registra/ui";
import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { DevelopmentBuyerEditSheet } from "@/features/developments/components/development-buyer-edit-sheet";
import {
  acquisitionTypeLabels,
  buyerStatusLabels,
  contractControlStatusLabels,
  getSupplierWorkflowDocumentTypeLabel,
  maritalLabels,
  type SupplierContractControlStatus,
  type SupplierWorkflowProcessDetail,
  type SupplierWorkflowProcessDocument,
  type SupplierWorkflowStage,
  workflowProcessStatusLabels,
  workflowStageStatusLabels,
} from "@/features/developments/core/developments-schema";
import {
  useDevelopmentBuyerDetailQuery,
  useSupplierWorkflowProcessDetailQuery,
  useUpdateBuyerMutation,
  useUploadSupplierContractDocumentMutation,
} from "@/features/developments/hooks/use-development-queries";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { routes } from "@/shared/constants/routes";

const paramsSchema = z.object({
  developmentId: z.string().trim().min(1),
  buyerId: z.string().trim().min(1),
});

function buildBuyerExperienceLink(developmentId: string, processId: string | null) {
  if (!processId) {
    return `https://registra.ai/experience/${developmentId}`;
  }

  return `https://registra.ai/processo/${developmentId}/${processId}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(date);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "-";
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

function resolveContractDocument(documents: SupplierWorkflowProcessDocument[]) {
  const activeDocuments = documents.filter((document) => {
    if (document.status === "replaced") {
      return false;
    }

    if (document.block === "contract") {
      return true;
    }

    return /contrat/i.test(document.type) || /contrat/i.test(document.originalFileName ?? "");
  });

  return (
    activeDocuments.sort((left, right) => {
      if (left.version !== right.version) {
        return right.version - left.version;
      }

      const leftTime = new Date(left.updatedAt ?? left.createdAt ?? 0).getTime();
      const rightTime = new Date(right.updatedAt ?? right.createdAt ?? 0).getTime();

      return rightTime - leftTime;
    })[0] ?? null
  );
}

function resolveContractDisplayStatus(
  contractControlStatus: SupplierContractControlStatus | null | undefined,
  contractDocument: SupplierWorkflowProcessDocument | null,
): SupplierContractControlStatus {
  if (contractControlStatus === "signed" || contractControlStatus === "completed") {
    return contractControlStatus;
  }

  if (contractControlStatus === "cancelled") {
    return "cancelled";
  }

  if (
    !contractDocument ||
    contractDocument.status === "replaced" ||
    contractDocument.status === "rejected"
  ) {
    return "awaiting_document_upload";
  }

  return "awaiting_signature";
}

function getDocumentDownloadUrl(documentId: string) {
  const apiBaseUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

  return `${apiBaseUrl}/api/v1/documents/${encodeURIComponent(documentId)}/download`;
}

function resolveProcessBadgeVariant(status: SupplierWorkflowProcessDetail["status"]) {
  if (status === "completed") {
    return "success" as const;
  }

  if (status === "not_started") {
    return "outline" as const;
  }

  return "secondary" as const;
}

function resolveStageBadgeVariant(status: SupplierWorkflowStage["status"]) {
  if (status === "completed") {
    return "success" as const;
  }

  if (status === "pending") {
    return "outline" as const;
  }

  return "secondary" as const;
}

function isContractStage(stage: SupplierWorkflowStage) {
  return stage.order === 2 || /contrat/i.test(stage.name);
}

function resolveCurrentStage(processDetail: SupplierWorkflowProcessDetail | null) {
  if (!processDetail) {
    return null;
  }

  return (
    processDetail.stages.find((stage) => stage.status === "in_progress") ??
    processDetail.stages.find((stage) => stage.id === processDetail.stageId) ??
    processDetail.stages[0] ??
    null
  );
}

export function DevelopmentBuyerDetailPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const contractFileInputRef = useRef<HTMLInputElement | null>(null);
  const [isEditSheetOpen, setEditSheetOpen] = useState(false);
  const [editErrorMessage, setEditErrorMessage] = useState<string | null>(null);
  const params = useParams<{ developmentId: string; buyerId: string }>();
  const parsedParams = paramsSchema.safeParse(params);
  const developmentId = parsedParams.success ? parsedParams.data.developmentId : null;
  const buyerId = parsedParams.success ? parsedParams.data.buyerId : null;
  const buyerDetailQuery = useDevelopmentBuyerDetailQuery(developmentId, buyerId);
  const updateBuyerMutation = useUpdateBuyerMutation(buyerId ?? "");
  const buyerDetail = buyerDetailQuery.data;
  const buyer = buyerDetail?.buyer ?? null;
  const processSummary = buyerDetail?.process ?? null;
  const processDetailQuery = useSupplierWorkflowProcessDetailQuery(processSummary?.id ?? null);
  const uploadContractMutation = useUploadSupplierContractDocumentMutation(
    processSummary?.id ?? "",
  );
  const processDetail = processDetailQuery.data ?? null;
  const currentStage = resolveCurrentStage(processDetail);

  if (!parsedParams.success) {
    return (
      <Card className="border-rose-200 bg-rose-50/80">
        <CardContent className="p-5">
          <p className="type-body font-medium text-rose-700">Comprador inválido.</p>
        </CardContent>
      </Card>
    );
  }

  if (buyerDetailQuery.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-[520px] rounded-2xl" />
      </div>
    );
  }

  if (buyerDetailQuery.isError || !buyerDetail || !buyer) {
    return (
      <Card className="border-rose-200 bg-rose-50/80">
        <CardContent className="space-y-3 p-5">
          <p className="type-body font-medium text-rose-700">
            {getApiErrorMessage(
              buyerDetailQuery.error,
              "Não foi possível carregar o detalhe do comprador.",
            )}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(routes.developmentDetailById(parsedParams.data.developmentId))}
          >
            Voltar para o empreendimento
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (developmentId && buyerDetail.development.id && buyerDetail.development.id !== developmentId) {
    return (
      <Card className="border-rose-200 bg-rose-50/80">
        <CardContent className="space-y-3 p-5">
          <p className="type-body font-medium text-rose-700">
            O comprador informado não pertence ao empreendimento desta rota.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(routes.developmentDetailById(developmentId))}
          >
            Voltar para o empreendimento
          </Button>
        </CardContent>
      </Card>
    );
  }

  const buyerExperienceLink = buildBuyerExperienceLink(
    developmentId ?? buyerDetail.development.id,
    processDetail?.id ?? processSummary?.id ?? null,
  );
  const enterpriseName = buyerDetail.supplier?.name ?? "Empresa não informada";
  const unitLabel =
    buyer.unitLabel ?? buyerDetail.availabilityItem?.displayLabel ?? "Unidade não informada";
  const currentStepLabel =
    currentStage?.name ??
    (processDetail
      ? workflowProcessStatusLabels[processDetail.status]
      : processSummary?.stageName?.trim()) ??
    "Sem processo";
  const processStatusLabel = processDetail
    ? workflowProcessStatusLabels[processDetail.status]
    : processSummary
      ? "Em andamento"
      : "Sem processo";

  return (
    <section className="mx-auto max-w-7xl px-6">
      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-12 overflow-hidden border-border/70 bg-[linear-gradient(180deg,rgba(var(--background),0.98),rgba(var(--muted),0.32))] shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-stretch xl:justify-between">
              <div className="flex-1 space-y-6">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between xl:gap-10">
                  <div className="flex items-start gap-4">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-semibold leading-8 tracking-[-0.02em] text-foreground">
                        {buyer.name}
                      </h2>
                      <p className="type-body text-muted-foreground">{buyer.email || "-"}</p>
                      <p className="type-body text-muted-foreground">{buyer.phone || "-"}</p>
                    </div>
                  </div>

                  <div className="space-y-3 xl:min-w-[280px]">
                    <div className="space-y-1 text-left lg:text-right">
                      <p className="type-body font-medium text-foreground">{enterpriseName}</p>
                      <p className="type-body text-muted-foreground">{unitLabel}</p>
                      <p className="type-caption text-muted-foreground">
                        {buyerDetail.development.name}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditErrorMessage(null);
                          setEditSheetOpen(true);
                        }}
                      >
                        <FileTextIcon className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={async () => {
                          await navigator.clipboard.writeText(buyerExperienceLink);
                          toast({
                            title: "Link copiado",
                            description:
                              "O link da visão do comprador foi copiado para a área de transferência.",
                          });
                        }}
                      >
                        <GitBranchIcon className="mr-2 h-4 w-4" />
                        Copiar link
                      </Button>
                    </div>
                  </div>
                </div>
                <Separator />
                <dl className="grid gap-x-8 gap-y-5 md:grid-cols-2 xl:grid-cols-4">
                  <div className="space-y-1">
                    <dt className="type-overline text-muted-foreground">CPF</dt>
                    <dd className="text-base font-semibold text-foreground">{buyer.cpf || "-"}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="type-overline text-muted-foreground">Estado civil</dt>
                    <dd className="text-base font-semibold text-foreground">
                      {buyer.maritalStatus ? maritalLabels[buyer.maritalStatus] : "-"}
                    </dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="type-overline text-muted-foreground">Aquisição</dt>
                    <dd className="text-base font-semibold text-foreground">
                      {buyer.acquisitionType ? acquisitionTypeLabels[buyer.acquisitionType] : "-"}
                    </dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="type-overline text-muted-foreground">Valor do imóvel</dt>
                    <dd className="text-base font-semibold text-foreground">
                      {buyer.purchaseValue ?? "-"}
                    </dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="type-overline text-muted-foreground">Contrato</dt>
                    <dd className="text-base font-semibold text-foreground">
                      {formatDate(buyer.contractDate)}
                    </dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="type-overline text-muted-foreground">Nacionalidade</dt>
                    <dd className="text-base font-semibold text-foreground">
                      {buyer.nationality ?? "-"}
                    </dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="type-overline text-muted-foreground">Profissão</dt>
                    <dd className="text-base font-semibold text-foreground">
                      {buyer.profession ?? "-"}
                    </dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="type-overline text-muted-foreground">Status</dt>
                    <dd>
                      <Badge variant={buyer.status === "active" ? "success" : "secondary"}>
                        {buyerStatusLabels[buyer.status]}
                      </Badge>
                    </dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="type-overline text-muted-foreground">Criado em</dt>
                    <dd className="text-base font-semibold text-foreground">
                      {formatDate(buyer.createdAt)}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-12 border-border/70 bg-card/95 shadow-sm">
          <CardHeader>
            <CardTitle>Status do processo</CardTitle>
            <CardDescription>Resumo imediato do ponto atual da jornada.</CardDescription>
          </CardHeader>
          <CardContent>
            {processSummary?.id && processDetailQuery.isPending ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
              </div>
            ) : processSummary?.id && processDetailQuery.isError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4">
                <p className="type-body font-medium text-rose-700">
                  {getApiErrorMessage(
                    processDetailQuery.error,
                    "Não foi possível carregar o processo.",
                  )}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3"
                  onClick={() => processDetailQuery.refetch()}
                >
                  Recarregar processo
                </Button>
              </div>
            ) : processDetail ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-border/70 bg-background/80 p-4">
                  <p className="type-overline text-muted-foreground">Etapa atual</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-foreground">{currentStepLabel}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/80 p-4">
                  <p className="type-overline text-muted-foreground">Status</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant={resolveProcessBadgeVariant(processDetail.status)}>
                      {processStatusLabel}
                    </Badge>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border/70 bg-background/60 p-4">
                <p className="type-body text-muted-foreground">
                  Nenhum processo vinculado a este comprador.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-12 border-border/70 bg-card/95 shadow-sm">
          <CardHeader>
            <CardTitle>Detalhe do progresso</CardTitle>
            <CardDescription>
              Cards construídos diretamente a partir das etapas retornadas pelo endpoint do
              processo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {processSummary?.id && processDetailQuery.isPending ? (
              <div className="space-y-4">
                <Skeleton className="h-44 rounded-2xl" />
                <Skeleton className="h-44 rounded-2xl" />
                <Skeleton className="h-44 rounded-2xl" />
              </div>
            ) : processSummary?.id && processDetailQuery.isError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4">
                <p className="type-body font-medium text-rose-700">
                  {getApiErrorMessage(
                    processDetailQuery.error,
                    "Não foi possível carregar o detalhe do processo.",
                  )}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3"
                  onClick={() => processDetailQuery.refetch()}
                >
                  Tentar novamente
                </Button>
              </div>
            ) : !processDetail || processDetail.stages.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 bg-background/60 p-4">
                <p className="type-body text-muted-foreground">
                  O processo ainda não possui etapas disponíveis para exibição.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {processDetail.stages.map((stage) => {
                  const documents = stage.process?.documents ?? [];
                  const isContract = isContractStage(stage);
                  const contractControl = stage.process?.contractControl ?? null;
                  const currentContractDocument = isContract
                    ? resolveContractDocument(documents)
                    : null;
                  const contractDisplayStatus = resolveContractDisplayStatus(
                    contractControl?.status,
                    currentContractDocument,
                  );
                  const canUploadContract =
                    isContract &&
                    !currentContractDocument &&
                    stage.status !== "completed" &&
                    Boolean(processSummary?.id) &&
                    !uploadContractMutation.isPending;

                  return (
                    <Card
                      key={stage.id}
                      className={
                        stage.status === "in_progress"
                          ? "border-primary/30 bg-primary/5 shadow-sm"
                          : "border-border/70 bg-background/70 shadow-none"
                      }
                    >
                      <CardHeader className="pb-3">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div className="space-y-1">
                            <CardTitle>{stage.name}</CardTitle>
                            <CardDescription>
                              {stage.description ?? `Etapa ${stage.order} do workflow.`}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Etapa {stage.order}</Badge>
                            <Badge variant={resolveStageBadgeVariant(stage.status)}>
                              {workflowStageStatusLabels[stage.status]}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div
                          className={`grid gap-4 ${isContract ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}
                        >
                          <div className="rounded-xl border border-border/60 bg-background/80 p-4">
                            <p className="type-overline text-muted-foreground">Situação da etapa</p>
                            <p className="mt-2 text-base font-semibold text-foreground">
                              {workflowStageStatusLabels[stage.status]}
                            </p>
                            <p className="mt-2 type-caption text-muted-foreground">
                              Processo atualizado em{" "}
                              {formatDateTime(stage.process?.updatedAt ?? processDetail.updatedAt)}
                            </p>
                          </div>

                          {isContract ? null : (
                            <div className="rounded-xl border border-border/60 bg-background/80 p-4">
                              <p className="type-overline text-muted-foreground">
                                Documentos da etapa
                              </p>
                              {documents.length > 0 ? (
                                <div className="mt-2 space-y-2">
                                  {documents.map((document) => (
                                    <div
                                      key={document.id}
                                      className="rounded-lg border border-border/60 px-3 py-2"
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div>
                                          <p className="type-caption font-medium text-foreground">
                                            {document.originalFileName ??
                                              getSupplierWorkflowDocumentTypeLabel(document.type)}
                                          </p>
                                          <p className="type-caption text-muted-foreground">
                                            {getSupplierWorkflowDocumentTypeLabel(document.type)} •
                                            v{document.version} •{" "}
                                            {formatFileSize(document.fileSize)}
                                          </p>
                                        </div>
                                        <Badge
                                          variant={
                                            document.status === "approved" ? "success" : "secondary"
                                          }
                                        >
                                          {document.status}
                                        </Badge>
                                      </div>
                                      <p className="mt-1 type-caption text-muted-foreground">
                                        Enviado por {document.uploadedBy ?? "-"} em{" "}
                                        {formatDateTime(document.createdAt)}
                                      </p>
                                      {document.metadata.deedRegistrationNumber ? (
                                        <p className="mt-1 type-caption font-medium text-emerald-700">
                                          Matrícula registrada:{" "}
                                          {document.metadata.deedRegistrationNumber}
                                        </p>
                                      ) : null}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="mt-2 type-caption text-muted-foreground">
                                  Nenhum documento enviado para esta etapa até o momento.
                                </p>
                              )}
                            </div>
                          )}
                          {isContract ? null : (
                            <div className="rounded-xl border border-border/60 bg-background/80 p-4">
                              <p className="type-overline text-muted-foreground">Observações</p>
                              {stage.notes.length > 0 ? (
                                <div className="mt-2 space-y-2">
                                  {stage.notes.map((note) => (
                                    <div
                                      key={note.id}
                                      className="rounded-lg border border-border/60 px-3 py-2"
                                    >
                                      <p className="type-caption text-foreground">{note.note}</p>
                                      <p className="mt-1 type-caption text-muted-foreground">
                                        {note.createdBy?.name ?? "Backoffice"} em{" "}
                                        {formatDateTime(note.createdAt)}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="mt-2 type-caption text-muted-foreground">
                                  Nenhuma observação registrada para esta etapa.
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {isContract ? (
                          <>
                            <Separator />
                            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                              <div className="space-y-4">
                                <div className="rounded-xl border border-border/60 bg-background/80 p-4">
                                  <p className="type-overline text-muted-foreground">
                                    Controle do contrato
                                  </p>
                                  <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <Badge
                                      variant={
                                        contractDisplayStatus === "signed" ? "success" : "secondary"
                                      }
                                    >
                                      {contractControlStatusLabels[contractDisplayStatus]}
                                    </Badge>
                                  </div>
                                  <p className="mt-2 type-caption text-muted-foreground">
                                    Última atualização:{" "}
                                    {formatDateTime(
                                      contractControl?.updatedAt ??
                                        currentContractDocument?.updatedAt ??
                                        currentContractDocument?.createdAt,
                                    )}
                                  </p>
                                </div>

                                <div className="rounded-xl border border-border/60 bg-background/80 p-4">
                                  <p className="type-overline text-muted-foreground">
                                    Envio do contrato
                                  </p>
                                  <Input
                                    ref={contractFileInputRef}
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    className="hidden"
                                    onChange={async (event) => {
                                      const input = event.currentTarget;
                                      const file = input.files?.[0] ?? null;

                                      if (!file || !processSummary?.id) {
                                        input.value = "";
                                        return;
                                      }

                                      try {
                                        await uploadContractMutation.mutateAsync(file);
                                        await processDetailQuery.refetch();
                                        toast({
                                          title: "Contrato enviado",
                                          description: `${file.name} foi enviado para a etapa de contrato.`,
                                        });
                                      } catch (error) {
                                        toast({
                                          title: "Falha ao enviar contrato",
                                          description: getApiErrorMessage(
                                            error,
                                            "Não foi possível enviar o contrato para o processo.",
                                          ),
                                        });
                                      } finally {
                                        input.value = "";
                                      }
                                    }}
                                  />
                                  {currentContractDocument ? (
                                    <div className="mt-3 rounded-lg border border-border/60 px-3 py-3">
                                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0 space-y-1">
                                          <p className="truncate text-sm font-medium text-foreground">
                                            {currentContractDocument.originalFileName ??
                                              currentContractDocument.type}
                                          </p>
                                          <p className="type-caption text-muted-foreground">
                                            {currentContractDocument.type} • v
                                            {currentContractDocument.version} •{" "}
                                            {formatFileSize(currentContractDocument.fileSize)}
                                          </p>
                                          <p className="type-caption text-muted-foreground">
                                            Enviado em{" "}
                                            {formatDateTime(currentContractDocument.createdAt)}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-2 self-end sm:self-auto">
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            aria-label="Visualizar contrato"
                                            onClick={() => {
                                              window.open(
                                                getDocumentDownloadUrl(currentContractDocument.id),
                                                "_blank",
                                                "noopener,noreferrer",
                                              );
                                            }}
                                          >
                                            <EyeIcon className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <p className="mt-2 type-caption text-muted-foreground">
                                        Nesta etapa o supplier pode enviar um único contrato por vez
                                        para seguir a jornada.
                                      </p>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="mt-3"
                                        disabled={!canUploadContract}
                                        onClick={() => contractFileInputRef.current?.click()}
                                      >
                                        <FileTextIcon className="mr-2 h-4 w-4" />
                                        {uploadContractMutation.isPending
                                          ? "Enviando contrato..."
                                          : "Enviar contrato"}
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="rounded-xl border border-border/60 bg-background/80 p-4">
                                <p className="type-overline text-muted-foreground">Observações</p>
                                {stage.notes.length > 0 ? (
                                  <div className="mt-2 space-y-2">
                                    {stage.notes.map((note) => (
                                      <div
                                        key={note.id}
                                        className="rounded-lg border border-border/60 px-3 py-2"
                                      >
                                        <p className="type-caption text-foreground">{note.note}</p>
                                        <p className="mt-1 type-caption text-muted-foreground">
                                          {note.createdBy?.name ?? "Backoffice"} em{" "}
                                          {formatDateTime(note.createdAt)}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="mt-2 type-caption text-muted-foreground">
                                    Nenhuma observação registrada para esta etapa.
                                  </p>
                                )}
                              </div>
                            </div>
                          </>
                        ) : null}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {buyer ? (
        <DevelopmentBuyerEditSheet
          open={isEditSheetOpen}
          buyer={buyer}
          isSubmitting={updateBuyerMutation.isPending}
          errorMessage={editErrorMessage}
          onOpenChange={(open) => {
            setEditSheetOpen(open);
            if (!open) {
              setEditErrorMessage(null);
            }
          }}
          onSubmit={async (values) => {
            setEditErrorMessage(null);

            try {
              await updateBuyerMutation.mutateAsync(values);
              await buyerDetailQuery.refetch();
              toast({
                title: "Comprador atualizado",
                description: "As alterações do comprador foram salvas com sucesso.",
              });
            } catch (error) {
              const message = getApiErrorMessage(error, "Não foi possível atualizar o comprador.");
              setEditErrorMessage(message);
              throw error;
            }
          }}
        />
      ) : null}
    </section>
  );
}
