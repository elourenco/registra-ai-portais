import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, toast } from "@registra/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/app/providers/auth-provider";
import {
  openDocumentInBrowser,
  patchDocumentValidationStatus,
} from "@/features/processes/api/document-validation-api";
import {
  advanceProcess,
  createProcessStageNote,
  updateProcessContractControl,
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
  ProcessStage,
  ProcessStageNote,
  UpdateContractControlResult,
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
  const [localStages, setLocalStages] = useState<ProcessStage[] | null>(null);
  const [localProcessStatus, setLocalProcessStatus] = useState<ProcessDetail["status"] | null>(null);

  useEffect(() => {
    setLocalStages(null);
    setLocalProcessStatus(null);
  }, [detail.id, detail.updatedAt]);

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
      stage,
      observation,
    }: {
      stage: ProcessDetail["stages"][number];
      observation: string;
    }) => {
      if (!session?.token) {
        throw new Error("Sessão inválida para concluir a etapa.");
      }

      const processId = stage.process?.id;
      if (!processId) {
        throw new Error("Processo atual da etapa não encontrado.");
      }

      const currentStageId = Number(stage.id);
      if (!Number.isInteger(currentStageId) || currentStageId <= 0) {
        throw new Error("Etapa atual inválida para avanço.");
      }

      return advanceProcess({
        token: session.token,
        processId,
        currentStageId,
        observation,
      });
    },
    onSuccess: async (result) => {
      setLocalStages(result.stages);
      setLocalProcessStatus(result.workflowCompleted ? "completed" : detail.status);
      await queryClient.invalidateQueries({ queryKey: ["processes", "detail"] });
      await onRefetch();
    },
  });

  const sendObservationMutation = useMutation({
    mutationFn: async ({
      processId,
      stageId,
      note,
    }: {
      processId: string;
      stageId: string;
      note: string;
    }) => {
      if (!session?.token) {
        throw new Error("Sessão inválida para enviar a observação.");
      }

      return createProcessStageNote({
        token: session.token,
        processId,
        stageId,
        note,
      });
    },
    onSuccess: async (createdNote, variables) => {
      setLocalStages((currentStages) => {
        const source = currentStages ?? detail.stages;
        return source.map((stage) =>
          stage.id === variables.stageId
            ? {
                ...stage,
                notes: mergeStageNotes(stage.notes, createdNote),
              }
            : stage,
        );
      });

      toast({
        title: "Observação enviada",
        description: "A observação do backoffice foi registrada na etapa.",
      });

      await queryClient.invalidateQueries({ queryKey: ["processes", "detail"] });
      await onRefetch();
    },
  });

  const updateContractControlMutation = useMutation({
    mutationFn: async ({
      processId,
      stageId,
      signatureUrl,
      contractControlStatus,
    }: {
      processId: string;
      stageId: string;
      signatureUrl: string | null;
      contractControlStatus: UpdateContractControlResult["contractControlStatus"];
    }) => {
      if (!session?.token) {
        throw new Error("Sessão inválida para salvar o controle do contrato.");
      }

      const parsedStageId = Number(stageId);
      if (!Number.isInteger(parsedStageId) || parsedStageId <= 0) {
        throw new Error("Etapa inválida para atualização do controle do contrato.");
      }

      return updateProcessContractControl({
        token: session.token,
        processId,
        stageId: parsedStageId,
        signatureUrl,
        contractControlStatus,
      });
    },
    onSuccess: async (result) => {
      setLocalStages((currentStages) => {
        const source = currentStages ?? detail.stages;
        return source.map((stage) =>
          stage.id === result.stageId
            ? {
                ...stage,
                process: stage.process
                  ? {
                      ...stage.process,
                      contractControl: {
                        signatureUrl: result.signatureUrl ?? null,
                        status: result.contractControlStatus,
                        updatedAt: result.updatedAt,
                        updatedBy: result.updatedBy,
                      },
                    }
                  : stage.process,
              }
            : stage,
        );
      });

      toast({
        title: "Controle do contrato salvo",
        description: "A URL e o status operacional do contrato foram atualizados.",
      });

      await queryClient.invalidateQueries({ queryKey: ["processes", "detail"] });
      await onRefetch();
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

  const contractControlError =
    updateContractControlMutation.isError && updateContractControlMutation.error
      ? getApiErrorMessage(
          updateContractControlMutation.error,
          "Não foi possível salvar o controle do contrato.",
        )
      : null;

  const sendObservationError =
    sendObservationMutation.isError && sendObservationMutation.error
      ? getApiErrorMessage(
          sendObservationMutation.error,
          "Não foi possível enviar a observação da etapa.",
        )
      : null;

  const orderedStages = useMemo(
    () => (localStages ?? detail.stages).slice().sort((left, right) => left.order - right.order),
    [detail.stages, localStages],
  );

  const resolvedProcessStatus = localProcessStatus ?? detail.status;

  const activeStage =
    orderedStages.find((stage) => stage.status === "in_progress") ??
    orderedStages.find((stage) => stage.status === "pending") ??
    orderedStages[orderedStages.length - 1] ??
    null;

  return (
    <section className="space-y-6">
      {patchError || viewError || completionError || sendObservationError || contractControlError ? (
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
          {sendObservationError ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-800">
              {sendObservationError}
            </p>
          ) : null}
          {contractControlError ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-800">
              {contractControlError}
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
                Processo #{detail.id} • {getStatusLabel(resolvedProcessStatus)}
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
                    if (!stage.process?.id) {
                      return Promise.resolve();
                    }

                    return sendObservationMutation
                      .mutateAsync({
                        processId: stage.process.id,
                        stageId: stage.id,
                        note: observation,
                      })
                      .then(() => undefined);
                  }}
                  onCompleteStage={(observation) =>
                    completeStageMutation.mutate({
                      stage,
                      observation,
                    })
                  }
                  onSaveContractControl={({ processId, stageId, signatureUrl, contractControlStatus }) =>
                    updateContractControlMutation
                      .mutateAsync({
                        processId,
                        stageId,
                        signatureUrl,
                        contractControlStatus,
                      })
                      .then(() => undefined)
                  }
                  savingContractControl={
                    updateContractControlMutation.isPending &&
                    updateContractControlMutation.variables?.stageId === stage.id
                  }
                  completing={completeStageMutation.isPending}
                  sendingObservation={
                    sendObservationMutation.isPending &&
                    sendObservationMutation.variables?.stageId === stage.id
                  }
                />
              ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function mergeStageNotes(existingNotes: ProcessStageNote[], createdNote: ProcessStageNote) {
  const nextNotes = [createdNote, ...existingNotes.filter((note) => note.id !== createdNote.id)];

  return nextNotes.sort((left, right) => {
    const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
    return rightTime - leftTime;
  });
}
