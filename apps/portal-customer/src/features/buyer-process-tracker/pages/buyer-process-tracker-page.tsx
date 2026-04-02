import { Skeleton } from "@registra/ui";
import { useNavigate } from "react-router-dom";

import { BuyerProcessTracker } from "../buyer-process-tracker";
import { useBuyerProcessTrackerQuery } from "../hooks/use-buyer-process-tracker-query";
import { routes } from "@/shared/constants/routes";

export function BuyerProcessTrackerPage() {
  const navigate = useNavigate();
  const buyerProcessTrackerQuery = useBuyerProcessTrackerQuery();

  if (buyerProcessTrackerQuery.isLoading && !buyerProcessTrackerQuery.data) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-0 py-10 sm:px-6">
        <Skeleton className="h-10 rounded-xl" />
        <Skeleton className="h-[420px] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-0 py-10 sm:px-6">
      <BuyerProcessTracker onResolveNow={() => navigate(routes.process)} />
    </div>
  );
}
