import { getApiErrorMessage } from "@/shared/api/http-client";

import { StatusTrackerCard } from "./components/status-tracker-card";
import {
  createBuyerProcessTrackerViewModel,
  defaultBuyerProcessTrackerViewModel,
  type BuyerProcessTrackerViewModel,
} from "./core/buyer-process-tracker-view-model";
import { useBuyerProcessTrackerQuery } from "./hooks/use-buyer-process-tracker-query";

interface BuyerProcessTrackerProps {
  fallback?: BuyerProcessTrackerViewModel;
  onResolveNow: () => void;
}

export function BuyerProcessTracker({ fallback, onResolveNow }: BuyerProcessTrackerProps) {
  const buyerProcessTrackerQuery = useBuyerProcessTrackerQuery();

  const viewModel = createBuyerProcessTrackerViewModel(
    buyerProcessTrackerQuery.data,
    fallback ?? defaultBuyerProcessTrackerViewModel,
  );
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
    />
  );
}
