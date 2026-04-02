import type {
  ProcessDocument,
  ProcessHistoryEvent,
  ProcessNotification,
  ProcessRequest,
  ProcessSharedFile,
  ProcessSubmission,
  RegistrationProcess,
  WorkflowBlock,
  WorkflowBlockStatus,
} from "@registra/shared";
import {
  Button,
  buttonVariants,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@registra/ui";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ContractWorkflowCard } from "@/features/registration-core/components/contract-workflow-card";
import { DocumentWorkflowManager } from "@/features/registration-core/components/document-workflow-manager";
import { HistoryTimeline } from "@/features/registration-core/components/history-timeline";
import { ProcessSharedFilesManager } from "@/features/registration-core/components/process-shared-files-manager";
import { StatusBadge } from "@/features/registration-core/components/status-badge";
import { WorkflowBlockCard } from "@/features/registration-core/components/workflow-block-card";
import {
  billingStatusLabels,
  blockStatusLabels,
  blockTitleLabels,
  documentTypeLabels,
  formatCpf,
  formatCurrency,
  formatDateTime,
  processStatusLabels,
  requestStatusLabels,
  requestTargetLabels,
  requestTypeLabels,
  requirementStatusLabels,
  taskStatusLabels,
  taskTypeLabels,
} from "@/features/registration-core/core/registration-presenters";
import { buildSupplierWorkspaceSidebar } from "@/features/registration-core/core/workspace-sidebar";
import type { ProcessDetail } from "@/features/processes/core/process-schema";
import { useProcessDetailQuery } from "@/features/processes/hooks/use-process-detail-query";
import { useSupplierDetailQuery } from "@/features/suppliers/hooks/use-supplier-detail-query";
import { routes } from "@/shared/constants/routes";
import { useRegisterPageHeader } from "@/shared/hooks/use-register-page-header";
import { useRegisterWorkspaceSidebar } from "@/shared/hooks/use-register-workspace-sidebar";

function buildHistoryEvent(
  processId: string,
  action: string,
  note: string,
  comment: string | null,
): ProcessHistoryEvent {
  return {
    id: `hist-local-${crypto.randomUUID()}`,
    processId,
    occurredAt: new Date().toISOString(),
    user: "Backoffice Registro360",
    action,
    note,
    comment,
  };
}

function buildNotification(
  processId: string,
  recipient: ProcessNotification["recipient"],
  title: string,
  description: string,
): ProcessNotification {
  return {
    id: `notif-local-${crypto.randomUUID()}`,
    processId,
    recipient,
    title,
    description,
    createdAt: new Date().toISOString(),
  };
}

function shouldCollapseCompletedBlock(block: WorkflowBlock): boolean {
  if (block.key === "registration") {
    return block.status === "registered";
  }

  if (block.key === "contract") {
    return block.status === "signed" || block.status === "approved";
  }

  return block.status === "approved";
}

function ApiProcessDetailView({
  detail,
  supplierName,
}: {
  detail: ProcessDetail;
  supplierName?: string | null;
}) {
  const getStatusLabel = (status: ProcessDetail["status"]) => {
    switch (status) {
      case "completed":
        return "Concluído";
      case "cancelled":
        return "Cancelado";
      case "waiting_supplier":
        return "Aguardando supplier";
      case "waiting_registry_office":
        return "Aguardando cartório";
      case "requirement_open":
        return "Exigência aberta";
      case "overdue":
        return "Em atraso";
      default:
        return "Em andamento";
    }
  };

  const activeStage =
    detail.stages.find((stage) => stage.status === "in_progress") ??
    detail.stages.find((stage) => stage.status === "pending") ??
    detail.stages[detail.stages.length - 1] ??
    null;

  return (
    <section className="space-y-6">
      <Card className="border-slate-200/80 bg-card/95 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{detail.name}</CardTitle>
              <CardDescription>
                Processo #{detail.id} • {getStatusLabel(detail.status)}
              </CardDescription>
            </div>

            <Link to={routes.processes} className={buttonVariants({ variant: "outline" })}>
              Lista de processos
            </Link>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Cliente</p>
              <p className="mt-1 font-medium">{supplierName ?? `Cliente #${detail.supplierCompanyId}`}</p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Workflow</p>
              <p className="mt-1 font-medium">{detail.workflow?.name ?? detail.workflowName ?? "-"}</p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Etapa atual</p>
              <p className="mt-1 font-medium">{activeStage?.name ?? detail.stageName ?? "-"}</p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Atualizado em</p>
              <p className="mt-1 font-medium">
                {detail.updatedAt ? formatDateTime(detail.updatedAt) : formatDateTime(detail.createdAt)}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-slate-200/80 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Andamento do workflow</CardTitle>
          <CardDescription>
            O backend já entrega o fluxo principal por etapas, mas ainda nao expoe os blocos
            operacionais completos da tela mockada.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {detail.stages.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              Nenhuma etapa retornada pela API para este processo.
            </p>
          ) : (
            detail.stages
              .slice()
              .sort((left, right) => left.order - right.order)
              .map((stage) => (
                <div
                  key={stage.id}
                  className="rounded-xl border border-slate-200/80 bg-background p-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">
                        {stage.order}. {stage.name}
                      </p>
                      {stage.description ? (
                        <p className="text-sm text-muted-foreground">{stage.description}</p>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {stage.status === "completed"
                        ? "Concluida"
                        : stage.status === "in_progress"
                          ? "Em andamento"
                          : "Pendente"}
                    </p>
                  </div>

                  {stage.rules.length > 0 ? (
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {stage.rules.map((rule) => (
                        <div
                          key={rule.id}
                          className="rounded-lg border border-slate-200/70 bg-slate-50/60 px-3 py-2 text-sm"
                        >
                          <p className="font-medium">{rule.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {rule.status === "completed" ? "Regra concluida" : "Regra pendente"}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}

export function ProcessDetailPage() {
  const { processId, processQuery, supplierId } = useProcessDetailQuery();
  const { supplierQuery } = useSupplierDetailQuery(supplierId ?? null);
  const processData = processQuery.data?.source === "mock" ? processQuery.data.data : null;
  const apiProcessData = processQuery.data?.source === "api" ? processQuery.data.data : null;
  const [processState, setProcessState] = useState<RegistrationProcess | null>(
    processData?.process ?? null,
  );
  const [requestsState, setRequestsState] = useState<ProcessRequest[]>(processData?.requests ?? []);
  const [documentsState, setDocumentsState] = useState<ProcessDocument[]>(
    processData?.documents ?? [],
  );
  const [historyState, setHistoryState] = useState<ProcessHistoryEvent[]>(
    processData?.history ?? [],
  );
  const [notificationsState, setNotificationsState] = useState<ProcessNotification[]>(
    processData?.notifications ?? [],
  );
  const [sharedFilesState, setSharedFilesState] = useState<ProcessSharedFile[]>(
    processData?.sharedFiles ?? [],
  );
  const [submissionsState, setSubmissionsState] = useState<ProcessSubmission[]>(
    processData?.submissions ?? [],
  );
  const [collapsedBlocks, setCollapsedBlocks] = useState<Record<WorkflowBlock["key"], boolean>>({
    certificate:
      processData?.process.blocks.some(
        (block) => block.key === "certificate" && shouldCollapseCompletedBlock(block),
      ) ?? false,
    contract:
      processData?.process.blocks.some(
        (block) => block.key === "contract" && shouldCollapseCompletedBlock(block),
      ) ?? false,
    registration:
      processData?.process.blocks.some(
        (block) => block.key === "registration" && shouldCollapseCompletedBlock(block),
      ) ?? false,
  });
  const resolvedSupplierName =
    supplierQuery.data?.legalName ??
    processData?.supplier.name ??
    apiProcessData?.supplierName ??
    (supplierId ? `Cliente #${supplierId}` : null);
  const resolvedSupplierCnpj =
    supplierQuery.data?.cnpj ?? processData?.supplier.cnpj ?? null;
  const workspaceSidebar = useMemo(() => {
    if (!supplierId || !resolvedSupplierName) {
      return null;
    }

    return buildSupplierWorkspaceSidebar({
      supplierId,
      supplierName: resolvedSupplierName,
      supplierCnpj: resolvedSupplierCnpj ?? "-",
    });
  }, [resolvedSupplierCnpj, resolvedSupplierName, supplierId]);

  useRegisterWorkspaceSidebar(workspaceSidebar);
  useRegisterPageHeader(
    apiProcessData
      ? {
          title: apiProcessData.name ?? apiProcessData.propertyLabel,
          description: `Processo ${apiProcessData.id}`,
          actions: [
            {
              label: "Lista de processos",
              to: routes.processes,
              variant: "outline",
            },
          ],
          showNotifications: false,
        }
      : processData
      ? {
          title: processData.process.propertyLabel,
          description: `Processo ${processData.process.id}`,
          actions: [
            {
              label: "Lista de processos",
              to: routes.processes,
              variant: "outline",
            },
          ],
          showNotifications: false,
        }
      : null,
  );

  useEffect(() => {
    if (!processData) {
      return;
    }

    setProcessState(processData.process);
    setRequestsState(processData.requests);
    setDocumentsState(processData.documents);
    setHistoryState(processData.history);
    setNotificationsState(processData.notifications);
    setSharedFilesState(processData.sharedFiles);
    setSubmissionsState(processData.submissions);
    setCollapsedBlocks({
      certificate: processData.process.blocks.some(
        (block) => block.key === "certificate" && shouldCollapseCompletedBlock(block),
      ),
      contract: processData.process.blocks.some(
        (block) => block.key === "contract" && shouldCollapseCompletedBlock(block),
      ),
      registration: processData.process.blocks.some(
        (block) => block.key === "registration" && shouldCollapseCompletedBlock(block),
      ),
    });
  }, [processData]);

  if (!processId) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="font-medium">Processo inválido.</p>
        </CardContent>
      </Card>
    );
  }

  if (processQuery.isPending) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="h-32 animate-pulse p-6" />
        </Card>
        <Card>
          <CardContent className="h-60 animate-pulse p-6" />
        </Card>
      </div>
    );
  }

  if (processQuery.isError || !processQuery.data) {
    return (
      <Card className="border-rose-200 bg-rose-50/70">
        <CardContent className="flex items-center justify-between gap-3 p-6">
          <div>
            <p className="font-medium text-rose-700">Falha ao carregar o processo.</p>
            <p className="text-sm text-rose-700/80">Revise o identificador e tente novamente.</p>
          </div>
          <Button type="button" onClick={() => processQuery.refetch()}>
            Recarregar
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (apiProcessData) {
    return <ApiProcessDetailView detail={apiProcessData} supplierName={resolvedSupplierName} />;
  }

  if (!processData) {
    return (
      <Card className="border-rose-200 bg-rose-50/70">
        <CardContent className="p-6">
          <p className="font-medium text-rose-700">Detalhe do processo indisponível.</p>
        </CardContent>
      </Card>
    );
  }

  const { buyer, development, process, requirements, supplier, tasks } = processData;

  const activeProcess = processState ?? process;
  const activeBlock =
    activeProcess.blocks.find((block) => !["approved", "registered"].includes(block.status)) ??
    activeProcess.blocks[activeProcess.blocks.length - 1];
  const pendingRequests = requestsState.filter((request) =>
    ["created", "sent", "in_review", "resubmission_requested"].includes(request.status),
  );
  const blockingRequest =
    pendingRequests.find((request) => request.block === activeBlock.key) ??
    pendingRequests[0] ??
    null;
  const documentsWaitingReview = documentsState.filter(
    (document) => document.status === "in_review",
  );
  const openRequirements = requirements.filter((requirement) => requirement.status !== "resolved");
  const dueDiffInDays = Math.ceil(
    (new Date(activeProcess.dueAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  const waitingOnLabel =
    activeProcess.status === "waiting_registry_office"
      ? "Cartório"
      : blockingRequest?.target === "buyer"
        ? "Comprador"
        : blockingRequest?.target === "supplier"
          ? "Supplier"
          : "Backoffice";
  const nextActionLabel =
    activeProcess.status === "waiting_registry_office"
      ? "Cobrar retorno do cartório e atualizar o andamento do protocolo."
      : blockingRequest
        ? `Validar e acompanhar a solicitação "${blockingRequest.title}" para destravar ${blockTitleLabels[blockingRequest.block]}.`
        : openRequirements[0]
          ? `Resolver exigência "${openRequirements[0].title}" para retomar o fluxo do registro.`
          : documentsWaitingReview[0]
            ? `Validar o documento "${documentsWaitingReview[0].name}" e registrar o parecer no processo.`
            : `Concluir a operação de ${blockTitleLabels[activeBlock.key]} e avançar o workflow.`;

  const deriveProcessStatus = (blocks: WorkflowBlock[]): RegistrationProcess["status"] => {
    const registrationBlock = blocks.find((block) => block.key === "registration");
    if (registrationBlock?.status === "registered") {
      return "completed";
    }

    if (blocks.some((block) => block.status === "requirement_open")) {
      return "requirement_open";
    }

    if (blocks.some((block) => block.status === "waiting_registry_office")) {
      return "waiting_registry_office";
    }

    if (
      blocks.some(
        (block) => block.status === "waiting_supplier" || block.status === "waiting_signature",
      )
    ) {
      return "waiting_supplier";
    }

    return "active";
  };

  const deriveCurrentStep = (blocks: WorkflowBlock[]): string => {
    const currentBlock =
      blocks.find((block) => !["approved", "registered"].includes(block.status)) ??
      blocks[blocks.length - 1];

    return `Bloco ${blocks.findIndex((block) => block.key === currentBlock.key) + 1} - ${currentBlock.title}`;
  };

  const handleUpdateBlockStatus = (
    blockKey: WorkflowBlock["key"],
    nextStatus: WorkflowBlockStatus,
  ) => {
    setProcessState((current) => {
      if (!current) {
        return current;
      }

      const nextBlocks = current.blocks.map((block) =>
        block.key === blockKey
          ? {
              ...block,
              status: nextStatus,
              lastUpdatedAt: new Date().toISOString(),
              latestResponseSummary: `Status atualizado manualmente para ${blockStatusLabels[nextStatus]}.`,
            }
          : block,
      );

      const approvedKeys = new Set(
        nextBlocks
          .filter((block) =>
            block.key === "registration"
              ? block.status === "registered"
              : block.status === "approved" || block.status === "signed",
          )
          .map((block) => block.key),
      );

      const normalizedBlocks = nextBlocks.map((block) => ({
        ...block,
        canStart: !block.dependsOn || approvedKeys.has(block.dependsOn),
      }));

      return {
        ...current,
        blocks: normalizedBlocks,
        currentStep: deriveCurrentStep(normalizedBlocks),
        status: deriveProcessStatus(normalizedBlocks),
      };
    });

    setHistoryState((current) => [
      buildHistoryEvent(
        activeProcess.id,
        "Status do bloco atualizado",
        `${blockTitleLabels[blockKey]} -> ${blockStatusLabels[nextStatus]}`,
        "Atualização manual realizada pelo backoffice.",
      ),
      ...current,
    ]);

    setCollapsedBlocks((current) => ({
      ...current,
      [blockKey]:
        blockKey === "registration"
          ? nextStatus === "registered"
          : blockKey === "contract"
            ? nextStatus === "signed" || nextStatus === "approved"
            : nextStatus === "approved",
    }));
  };

  const handleSaveContractSignatureLink = (
    blockKey: WorkflowBlock["key"],
    signatureLink: string,
  ) => {
    setProcessState((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        blocks: current.blocks.map((block) =>
          block.key === blockKey
            ? {
                ...block,
                signatureLink: signatureLink.trim() || null,
                lastUpdatedAt: new Date().toISOString(),
              }
            : block,
        ),
      };
    });

    setHistoryState((current) => [
      buildHistoryEvent(
        activeProcess.id,
        "Link de assinatura atualizado",
        "Contrato com assinatura externa",
        signatureLink.trim() || "Link removido pelo backoffice.",
      ),
      ...current,
    ]);
  };

  const handleSaveGeneratedContractPdf = (blockKey: WorkflowBlock["key"], fileName: string) => {
    setProcessState((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        blocks: current.blocks.map((block) =>
          block.key === blockKey
            ? {
                ...block,
                generatedContractPdfName: fileName.trim() || null,
                lastUpdatedAt: new Date().toISOString(),
              }
            : block,
        ),
      };
    });

    setHistoryState((current) => [
      buildHistoryEvent(
        activeProcess.id,
        "Contrato final anexado",
        "PDF do contrato armazenado no bloco de assinatura",
        fileName.trim() || "Sem arquivo informado.",
      ),
      ...current,
    ]);
  };

  const updateDocumentWorkflow = (
    documentId: string,
    nextStatus: ProcessDocument["status"],
    requestStatus: ProcessRequest["status"],
    action: string,
    fallbackComment: string,
  ) => {
    const targetDocument = documentsState.find((item) => item.id === documentId);
    if (!targetDocument) {
      return;
    }

    const comment =
      fallbackComment.trim() || targetDocument.comments || "Sem comentário adicional.";
    const recipient = targetDocument.uploadedBy === "buyer" ? "buyer" : "supplier";

    setDocumentsState((current) =>
      current.map((item) =>
        item.id === documentId
          ? {
              ...item,
              status: nextStatus,
              comments: comment,
            }
          : item,
      ),
    );

    setRequestsState((current) =>
      current.map((request) =>
        request.id === targetDocument.requestId
          ? {
              ...request,
              status: requestStatus,
            }
          : request,
      ),
    );

    setHistoryState((current) => [
      buildHistoryEvent(
        process.id,
        action,
        `${targetDocument.name} · v${targetDocument.version}`,
        comment,
      ),
      ...current,
    ]);

    setNotificationsState((current) => [
      buildNotification(
        process.id,
        recipient,
        action,
        `${targetDocument.name} recebeu atualização de status: ${nextStatus}.`,
      ),
      ...current,
    ]);
  };

  const handleApproveDocument = (documentId: string, comment: string) => {
    updateDocumentWorkflow(documentId, "approved", "approved", "Documento aprovado", comment);
  };

  const handleRejectDocument = (documentId: string, comment: string) => {
    updateDocumentWorkflow(documentId, "rejected", "rejected", "Documento reprovado", comment);
  };

  const handleRequestResubmission = (documentId: string, comment: string) => {
    const targetDocument = documentsState.find((item) => item.id === documentId);
    if (!targetDocument) {
      return;
    }

    updateDocumentWorkflow(
      documentId,
      "resubmission_requested",
      "resubmission_requested",
      "Reenvio solicitado",
      comment || "Backoffice solicitou novo envio do documento.",
    );

    const newRequest: ProcessRequest = {
      id: `req-local-${crypto.randomUUID()}`,
      processId: process.id,
      block: targetDocument.block,
      target: targetDocument.uploadedBy === "buyer" ? "buyer" : "supplier",
      title: `Reenviar ${targetDocument.name}`,
      type: "document_submission",
      description: comment || `Novo envio solicitado para ${targetDocument.name}.`,
      requiredDocuments: [documentTypeLabels[targetDocument.type]],
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
      status: "sent",
      createdAt: new Date().toISOString(),
      sentAt: new Date().toISOString(),
      respondedAt: null,
    };

    setRequestsState((current) => [newRequest, ...current]);
  };

  const handleCreateSharedFile = (input: {
    audience: ProcessSharedFile["audience"];
    block: ProcessSharedFile["block"];
    title: string;
    description: string;
    fileName: string;
  }) => {
    const newFile: ProcessSharedFile = {
      id: `shared-local-${crypto.randomUUID()}`,
      processId: process.id,
      block: input.block,
      audience: input.audience,
      title: input.title,
      description: input.description,
      fileName: input.fileName,
      fileUrl: `/mock/shared/${encodeURIComponent(input.fileName)}`,
      uploadedBy: "Backoffice Registro360",
      createdAt: new Date().toISOString(),
    };

    setSharedFilesState((current) => [newFile, ...current]);
    setHistoryState((current) => [
      buildHistoryEvent(
        process.id,
        "Anexo compartilhado pelo backoffice",
        `${input.title} · ${blockTitleLabels[input.block]}`,
        `Arquivo disponibilizado para ${input.audience === "both" ? "supplier e comprador" : input.audience === "supplier" ? "supplier" : "comprador"}.`,
      ),
      ...current,
    ]);

    if (input.audience === "supplier" || input.audience === "both") {
      setNotificationsState((current) => [
        buildNotification(
          process.id,
          "supplier",
          "Novo arquivo disponível no processo",
          `${input.title} foi anexado pelo backoffice no bloco ${blockTitleLabels[input.block]}.`,
        ),
        ...current,
      ]);
    }

    if (input.audience === "buyer" || input.audience === "both") {
      setNotificationsState((current) => [
        buildNotification(
          process.id,
          "buyer",
          "Novo arquivo disponível no processo",
          `${input.title} foi anexado pelo backoffice no bloco ${blockTitleLabels[input.block]}.`,
        ),
        ...current,
      ]);
    }
  };

  const handleToggleBlockCollapse = (blockKey: WorkflowBlock["key"]) => {
    setCollapsedBlocks((current) => ({
      ...current,
      [blockKey]: !current[blockKey],
    }));
  };

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{activeProcess.propertyLabel}</CardTitle>
              <CardDescription>
                {supplier.name} · {development.name} · Comprador {buyer.name}
              </CardDescription>
            </div>
            <StatusBadge
              status={activeProcess.status}
              label={processStatusLabels[activeProcess.status]}
            />
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          <div className="rounded-xl border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Comprador</p>
            <p className="mt-2 font-medium">{buyer.name}</p>
            <p className="text-sm text-muted-foreground">
              {formatCpf(buyer.cpf)} · {buyer.email}
            </p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Registro</p>
            <p className="mt-2 font-medium">{activeProcess.registrationNumber}</p>
            <p className="text-sm text-muted-foreground">{activeProcess.registryOffice}</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Responsável interno
            </p>
            <p className="mt-2 font-medium">{activeProcess.internalOwner}</p>
            <p className="text-sm text-muted-foreground">{activeProcess.currentStep}</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Cobrança única</p>
            <p className="mt-2 font-medium">{formatCurrency(activeProcess.billing.unitValue)}</p>
            <div className="mt-2">
              <StatusBadge
                status={activeProcess.billing.status}
                label={billingStatusLabels[activeProcess.billing.status]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardContent className="space-y-2 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Aguardando ação de
            </p>
            <p className="text-2xl font-semibold">{waitingOnLabel}</p>
            <p className="text-sm text-muted-foreground">
              Responsável que precisa responder para o processo avançar agora.
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardContent className="space-y-2 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Próxima ação do backoffice
            </p>
            <p className="text-sm font-medium leading-6">{nextActionLabel}</p>
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardContent className="space-y-2 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Pendências abertas
            </p>
            <p className="text-2xl font-semibold">
              {pendingRequests.length + documentsWaitingReview.length + openRequirements.length}
            </p>
            <p className="text-sm text-muted-foreground">
              {pendingRequests.length} solicitações, {documentsWaitingReview.length} documentos e{" "}
              {openRequirements.length} exigências.
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardContent className="space-y-2 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              SLA do processo
            </p>
            <p className="text-2xl font-semibold">
              {dueDiffInDays >= 0
                ? `${dueDiffInDays} dias`
                : `${Math.abs(dueDiffInDays)} dias em atraso`}
            </p>
            <p className="text-sm text-muted-foreground">
              Prazo final em {formatDateTime(activeProcess.dueAt)}.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {activeProcess.blocks.map((block) => {
          const blockRequests = requestsState.filter((request) => request.block === block.key);
          const blockRequestIds = new Set(blockRequests.map((request) => request.id));
          const blockSubmissions = submissionsState.filter((submission) =>
            blockRequestIds.has(submission.requestId),
          );
          const blockDocuments = documentsState.filter((document) => document.block === block.key);

          return block.key === "contract" ? (
            <ContractWorkflowCard
              key={block.key}
              block={block}
              collapsed={collapsedBlocks[block.key]}
              documents={blockDocuments}
              requests={blockRequests}
              submissions={blockSubmissions}
              onUpdateStatus={handleUpdateBlockStatus}
              onSaveGeneratedContractPdf={handleSaveGeneratedContractPdf}
              onSaveSignatureLink={handleSaveContractSignatureLink}
              onToggleCollapse={handleToggleBlockCollapse}
            />
          ) : (
            <WorkflowBlockCard
              key={block.key}
              block={block}
              collapsed={collapsedBlocks[block.key]}
              documents={blockDocuments}
              requests={blockRequests}
              submissions={blockSubmissions}
              onUpdateStatus={handleUpdateBlockStatus}
              onToggleCollapse={handleToggleBlockCollapse}
            />
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Solicitações operacionais da jornada</CardTitle>
            <CardDescription>
              Solicitações, submissões e respostas trocadas entre backoffice, supplier e comprador.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {requestsState.map((item) => {
              const relatedSubmission = submissionsState.find(
                (submission) => submission.requestId === item.id,
              );

              return (
                <div key={item.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={item.status} label={requestStatusLabels[item.status]} />
                    <span className="text-xs text-muted-foreground">
                      {blockTitleLabels[item.block]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {requestTypeLabels[item.type]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {requestTargetLabels[item.target]}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Prazo {formatDateTime(item.deadline)}
                  </p>
                  {relatedSubmission ? (
                    <div className="mt-3 rounded-lg border border-border/70 bg-muted/20 p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Última submissão
                      </p>
                      <p className="mt-1 text-sm">{relatedSubmission.notes}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDateTime(relatedSubmission.submittedAt)}
                      </p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tarefas operacionais</CardTitle>
            <CardDescription>
              Backoffice acompanha validação, follow-up, correção e envio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.map((item) => (
              <div key={item.id} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={item.status} label={taskStatusLabels[item.status]} />
                  <span className="text-xs text-muted-foreground">{taskTypeLabels[item.type]}</span>
                </div>
                <p className="mt-2 font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {item.assignee} · prazo {formatDateTime(item.dueAt)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <DocumentWorkflowManager
          documents={documentsState}
          requests={requestsState}
          submissions={submissionsState}
          notifications={notificationsState}
          onApprove={handleApproveDocument}
          onReject={handleRejectDocument}
          onRequestResubmission={handleRequestResubmission}
        />
        <Card>
          <CardHeader>
            <CardTitle>Exigências</CardTitle>
            <CardDescription>
              Controle completo de apontamentos do cartório e ação esperada de supplier ou
              comprador.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {requirements.length > 0 ? (
              requirements.map((item) => (
                <div key={item.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      status={item.status}
                      label={requirementStatusLabels[item.status]}
                    />
                    {item.supplierActionRequired ? (
                      <span className="text-xs text-amber-700">Ação externa obrigatória</span>
                    ) : null}
                  </div>
                  <p className="mt-2 font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma exigência registrada para este processo.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <ProcessSharedFilesManager files={sharedFilesState} onCreateFile={handleCreateSharedFile} />

      <HistoryTimeline items={historyState} />
    </section>
  );
}
