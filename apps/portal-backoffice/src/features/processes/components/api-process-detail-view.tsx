import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, toast } from "@registra/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { useAuth } from "@/app/providers/auth-provider";
import {
  openDocumentInBrowser,
  patchDocumentValidationStatus,
} from "@/features/processes/api/document-validation-api";
import {
  createSupplierProcess as createNextSupplierProcess,
  updateSupplierProcess as completeCurrentSupplierProcess,
} from "@/features/processes/api/processes-api";
import type {
  ApiProcessOperationalDetail,
  ApiProcessRequirementStatus,
  ApiProcessRequestStatus,
  ApiProcessTaskStatus,
} from "@/features/processes/api/process-operational-api";
import { ProcessStageCard } from "@/features/processes/components/process-stage-card";
import type {
  ProcessDetail,
  WorkflowProcessDocumentStatus,
} from "@/features/processes/core/process-schema";
import { formatDateTime } from "@/features/registration-core/core/registration-presenters";
import { getApiErrorMessage } from "@/shared/api/http-client";

type ApiProcessDetailViewProps = {
  detail: ProcessDetail;
  operational: ApiProcessOperationalDetail;
  supplierName?: string | null;
  onRefetch: () => Promise<unknown>;
  onOpenBuyerInfo: () => void;
};

const requestStatusLabels: Record<ApiProcessRequestStatus, string> = {
  pending: "Pendente",
  completed: "Concluída",
  cancelled: "Cancelada",
};

const requestTypeLabels = {
  documentation: "Documentação",
  approval: "Aprovação",
  payment: "Pagamento",
  registry: "Registro",
};

const requestTargetLabels = {
  supplier: "Fornecedor",
  buyer: "Comprador",
  backoffice: "Backoffice",
  registry_office: "Cartório",
};

const taskStatusLabels: Record<ApiProcessTaskStatus, string> = {
  pending: "Pendente",
  in_progress: "Em andamento",
  completed: "Concluída",
  cancelled: "Cancelada",
};

const taskTypeLabels = {
  follow_up: "Acompanhamento",
  document_review: "Revisão documental",
  registry_contact: "Contato com cartório",
  internal: "Interna",
};

const requirementStatusLabels: Record<ApiProcessRequirementStatus, string> = {
  open: "Aberta",
  in_progress: "Em andamento",
  resolved: "Resolvida",
  dismissed: "Descartada",
};

function ApiStatusBadge({ status, label }: { status: string; label: string }) {
  const success = new Set(["approved", "completed", "resolved"]);
  const danger = new Set(["rejected", "cancelled", "dismissed"]);
  const warning = new Set(["pending", "under_review", "in_progress", "open"]);

  const variant = success.has(status)
    ? "success"
    : danger.has(status)
      ? "danger"
      : warning.has(status)
        ? "warning"
        : "secondary";

  return <Badge variant={variant}>{label}</Badge>;
}

export function ApiProcessDetailView({
  detail,
  operational,
  supplierName,
  onRefetch,
  onOpenBuyerInfo,
}: ApiProcessDetailViewProps) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [transitionState, setTransitionState] = useState<{
    completedStageId: string | null;
    nextStageId: string | null;
  }>({
    completedStageId: null,
    nextStageId: null,
  });

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

  const patchDocumentMutation = useMutation({
    mutationFn: patchDocumentValidationStatus,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["processes", "detail"] });
      await onRefetch();
    },
  });

  const completeStageMutation = useMutation({
    mutationFn: async ({
      stageId,
      observation,
    }: {
      stageId: string;
      observation: string;
    }) => {
      if (!session?.token) {
        throw new Error("Sessão inválida para concluir a etapa.");
      }

      if (!detail.supplierCompanyId) {
        throw new Error("Supplier do processo não identificado.");
      }

      const currentStageIndex = detail.stages.findIndex((stage) => stage.id === stageId);
      if (currentStageIndex < 0) {
        throw new Error("Etapa atual não encontrada.");
      }

      const currentStage = detail.stages[currentStageIndex];
      const currentProcessId = currentStage.process?.id;
      if (!currentProcessId) {
        throw new Error("Processo atual da etapa não encontrado.");
      }

      const nextStage = detail.stages
        .slice()
        .sort((left, right) => left.order - right.order)
        .find((stage) => stage.order > currentStage.order);

      if (!nextStage) {
        throw new Error("Não existe próxima etapa cadastrada para este workflow.");
      }

      const workflowId = Number(detail.workflow?.id ?? detail.workflowId ?? currentStage.workflowId);
      if (!Number.isInteger(workflowId) || workflowId <= 0) {
        throw new Error("Workflow inválido para criar o processo da próxima etapa.");
      }

      setTransitionState({
        completedStageId: currentStage.id,
        nextStageId: nextStage.id,
      });

      await completeCurrentSupplierProcess({
        token: session.token,
        supplierId: detail.supplierCompanyId,
        processId: currentProcessId,
        status: "completed",
      });

      await createNextSupplierProcess({
        token: session.token,
        supplierId: detail.supplierCompanyId,
        name: detail.name ?? detail.propertyLabel ?? `Processo ${detail.id}`,
        workflowId,
      });

      if (observation) {
        toast({
          title: "Observação aplicada localmente",
          description:
            "A API ainda não expõe persistência dedicada para observações de etapa; o texto foi mantido na tela durante a transição.",
        });
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["processes", "detail"] });
      await onRefetch();
    },
    onError: () => {
      setTransitionState({
        completedStageId: null,
        nextStageId: null,
      });
    },
    onSettled: () => {
      setTransitionState({
        completedStageId: null,
        nextStageId: null,
      });
    },
  });

  const viewDocumentMutation = useMutation({
    mutationFn: async ({ documentId }: { documentId: string }) => {
      if (!session?.token) {
        throw new Error("Sessão inválida para abrir o documento.");
      }

      await openDocumentInBrowser({ token: session.token, documentId });
    },
  });

  const handlePatchDocument = (input: {
    documentId: string;
    status: WorkflowProcessDocumentStatus;
    comments?: string;
  }) => {
    if (!session?.token) {
      return;
    }

    patchDocumentMutation.mutate({
      token: session.token,
      documentId: input.documentId,
      status: input.status,
      comments: input.comments,
    });
  };

  const patchError =
    patchDocumentMutation.isError && patchDocumentMutation.error
      ? getApiErrorMessage(patchDocumentMutation.error, "Não foi possível atualizar o documento.")
      : null;

  const viewError =
    viewDocumentMutation.isError && viewDocumentMutation.error
      ? getApiErrorMessage(viewDocumentMutation.error, "Não foi possível abrir o documento.")
      : null;

  const completionError =
    completeStageMutation.isError && completeStageMutation.error
      ? getApiErrorMessage(completeStageMutation.error, "Não foi possível concluir a etapa.")
      : null;

  const orderedStages = useMemo(
    () =>
      detail.stages
        .slice()
        .sort((left, right) => left.order - right.order)
        .map((stage) => {
          if (transitionState.completedStageId === stage.id) {
            return {
              ...stage,
              status: "completed" as const,
            };
          }

          if (transitionState.nextStageId === stage.id) {
            return {
              ...stage,
              status: "in_progress" as const,
            };
          }

          return stage;
        }),
    [detail.stages, transitionState.completedStageId, transitionState.nextStageId],
  );

  const activeStage =
    orderedStages.find((stage) => stage.status === "in_progress") ??
    orderedStages.find((stage) => stage.status === "pending") ??
    orderedStages[orderedStages.length - 1] ??
    null;

  return (
    <section className="space-y-6">
      {patchError || viewError || completionError ? (
        <div className="space-y-2">
          {patchError ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-800">
              {patchError}
            </p>
          ) : null}
          {viewError ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-800">
              {viewError}
            </p>
          ) : null}
          {completionError ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-800">
              {completionError}
            </p>
          ) : null}
        </div>
      ) : null}

      <Card className="border-slate-200/80 bg-card/95 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{detail.name}</CardTitle>
              <CardDescription>
                Processo #{detail.id} • {getStatusLabel(detail.status)}
              </CardDescription>
            </div>

            <Button type="button" variant="outline" onClick={onOpenBuyerInfo}>
              Informações do comprador
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Cliente</p>
              <p className="mt-1 font-medium">
                {supplierName ?? `Cliente #${detail.supplierCompanyId}`}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Workflow</p>
              <p className="mt-1 font-medium">
                {detail.workflow?.name ?? detail.workflowName ?? "-"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Etapa atual</p>
              <p className="mt-1 font-medium">{activeStage?.name ?? detail.stageName ?? "-"}</p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Atualizado em</p>
              <p className="mt-1 font-medium">
                {detail.updatedAt
                  ? formatDateTime(detail.updatedAt)
                  : formatDateTime(detail.createdAt)}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-slate-200/80 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Detalhe do processo</CardTitle>
          <CardDescription>
            Visualize o detalhe do processo e as etapas do workflow.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {orderedStages.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              Nenhuma etapa retornada pela API para este processo.
            </p>
          ) : (
            orderedStages.map((stage) => (
                <ProcessStageCard
                  key={stage.id}
                  stage={stage}
                  buyer={detail.buyer ?? null}
                  onPatchDocument={session?.token ? handlePatchDocument : undefined}
                  patchingDocumentId={
                    patchDocumentMutation.isPending
                      ? (patchDocumentMutation.variables?.documentId ?? null)
                      : null
                  }
                  onViewDocument={
                    session?.token
                      ? (documentId) => viewDocumentMutation.mutate({ documentId })
                      : undefined
                  }
                  viewingDocumentId={
                    viewDocumentMutation.isPending
                      ? (viewDocumentMutation.variables?.documentId ?? null)
                      : null
                  }
                  onSendObservation={(observation) => {
                    toast({
                      title: "Observação pronta para envio",
                      description:
                        "A API do detalhe do processo ainda não possui endpoint dedicado para persistir observações isoladas desta etapa.",
                    });

                    void observation;
                  }}
                  onCompleteStage={(observation) =>
                    completeStageMutation.mutate({
                      stageId: stage.id,
                      observation,
                    })
                  }
                  completing={completeStageMutation.isPending}
                  sendingObservation={false}
                />
              ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}
