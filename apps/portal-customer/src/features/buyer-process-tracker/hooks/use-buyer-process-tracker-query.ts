import { useBuyerProcessQuery } from "../../buyer-onboarding/hooks/use-buyer-process-query";

export function useBuyerProcessTrackerQuery() {
  return useBuyerProcessQuery({
    refetchOnMount: "always",
  });
}
