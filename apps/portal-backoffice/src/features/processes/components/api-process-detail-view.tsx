import {
  buttonVariants,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@registra/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { useAuth } from "@/app/providers/auth-provider";
import {
  openDocumentInBrowser,
  patchDocumentValidationStatus,
} from "@/features/processes/api/document-validation-api";
import { ProcessStageCard } from "@/features/processes/components/process-stage-card";
import type { ProcessDetail, WorkflowProcessDocumentStatus } from "@/features/processes/core/process-schema";
import { formatDateTime } from "@/features/registration-core/core/registration-presenters";
import { routes } from "@/shared/constants/routes";
import { getApiErrorMessage } from "@/shared/api/http-client";

type ApiProcessDetailViewProps = {
  detail: ProcessDetail;
  supplierName?: string | null;
  onRefetch: () => Promise<unknown>;
};

export function ApiProcessDetailView({ detail, supplierName, onRefetch }: ApiProcessDetailViewProps) {
  const { session } = useAuth();
  const queryClient = useQueryClient();

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

  const patchDocumentMutation = useMutation({
    mutationFn: patchDocumentValidationStatus,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["processes", "detail"] });
      await onRefetch();
    },
  });

  const completeStageMutation = useMutation({
    mutationFn: async (_observation: string) => {
      /** API: ainda não há endpoint dedicado para concluir etapa do processo com observação; apenas refetch. */
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

  return (
    <section className="space-y-6">
      {patchError || viewError ? (
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
          <CardTitle className="text-lg">Detalhe do processo</CardTitle>
          <CardDescription>
            Visualize o detalhe do processo e as etapas do workflow.
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
                  onCompleteStage={(observation) => completeStageMutation.mutate(observation)}
                  completing={completeStageMutation.isPending}
                />
              ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}
