import type { BuyerProcessDocument } from "@registra/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/app/providers/auth-provider";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { uploadBuyerDocument } from "../buyer-onboarding/api/buyer-process-api";
import { getBuyerProcessQueryKey } from "../buyer-onboarding/hooks/use-buyer-process-query";
import { StatusTrackerCard } from "./components/status-tracker-card";
import {
  type BuyerProcessTrackerViewModel,
  createBuyerProcessTrackerViewModel,
  defaultBuyerProcessTrackerViewModel,
} from "./core/buyer-process-tracker-view-model";
import { useBuyerProcessTrackerQuery } from "./hooks/use-buyer-process-tracker-query";

interface BuyerProcessTrackerProps {
  fallback?: BuyerProcessTrackerViewModel;
  onResolveNow: () => void;
}

export function BuyerProcessTracker({ fallback, onResolveNow }: BuyerProcessTrackerProps) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const buyerProcessTrackerQuery = useBuyerProcessTrackerQuery();
  const viewModel = createBuyerProcessTrackerViewModel(
    buyerProcessTrackerQuery.data,
    fallback ?? defaultBuyerProcessTrackerViewModel,
  );
  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ document, file }: { document: BuyerProcessDocument; file: File }) => {
      if (!session?.token) {
        throw new Error("Sessão inválida para enviar o documento.");
      }

      const processId = Number(viewModel.processId);
      if (!Number.isInteger(processId) || processId <= 0) {
        throw new Error("Processo inválido para envio do documento.");
      }

      const block = document.block?.trim();
      const type = document.type?.trim();
      if (!block || !type) {
        throw new Error("Documento sem tipo ou bloco para upload.");
      }

      return uploadBuyerDocument(
        {
          processId,
          block,
          type,
          uploadedBy: "buyer",
          file,
        },
        session.token,
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: getBuyerProcessQueryKey(session) });
      await buyerProcessTrackerQuery.refetch();
    },
  });

  const refreshErrorMessage = buyerProcessTrackerQuery.isError
    ? getApiErrorMessage(
        buyerProcessTrackerQuery.error,
        "Não foi possível atualizar o andamento agora. Exibindo os últimos dados disponíveis.",
      )
    : null;

  return (
    <StatusTrackerCard
      status={viewModel.status}
      timeline={viewModel.timeline}
      documents={viewModel.documents}
      processId={viewModel.processId}
      pendingAction={viewModel.pendingAction}
      hasEnotariadoCertificate={viewModel.hasEnotariadoCertificate}
      isRefreshing={buyerProcessTrackerQuery.isFetching}
      refreshErrorMessage={refreshErrorMessage}
      onResolveNow={onResolveNow}
      onUploadDocument={(document, file) =>
        uploadDocumentMutation.mutateAsync({ document, file }).then(() => undefined)
      }
      uploadingDocumentId={
        uploadDocumentMutation.isPending
          ? (uploadDocumentMutation.variables?.document.id ?? null)
          : null
      }
      uploadErrorMessage={
        uploadDocumentMutation.isError
          ? getApiErrorMessage(uploadDocumentMutation.error, "Não foi possível enviar o documento.")
          : null
      }
    />
  );
}
