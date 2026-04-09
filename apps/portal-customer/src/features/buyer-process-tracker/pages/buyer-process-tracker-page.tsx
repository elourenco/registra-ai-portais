import { Skeleton } from "@registra/ui";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { BuyerProcessTracker } from "../buyer-process-tracker";
import { useBuyerProcessTrackerQuery } from "../hooks/use-buyer-process-tracker-query";
import { routes } from "@/shared/constants/routes";

export function BuyerProcessTrackerPage() {
  const navigate = useNavigate();
  const buyerProcessTrackerQuery = useBuyerProcessTrackerQuery();

  useEffect(() => {
    if (buyerProcessTrackerQuery.isSuccess) {
      const isNotSubmitted =
        !buyerProcessTrackerQuery.data ||
        !buyerProcessTrackerQuery.data.basicDataConfirmed ||
        buyerProcessTrackerQuery.data.documents.length === 0;

      if (isNotSubmitted) {
        navigate(routes.process, { replace: true });
      }
    }
  }, [buyerProcessTrackerQuery.isSuccess, buyerProcessTrackerQuery.data, navigate]);

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
