import type { AuthenticatedBuyerProcessesResponse } from "@registra/shared";


export function shouldRedirectToBuyerProcessTracker(
  response: AuthenticatedBuyerProcessesResponse,
) {
  if (!response.buyer?.basicDataConfirmed) {
    return false;
  }

  return response.stages.some((stage) => {
    return (
      stage &&
      typeof stage === "object" &&
      stage.process &&
      typeof stage.process === "object" &&
      Array.isArray(stage.process.documents) &&
      stage.process.documents.length > 0
    );
  });
}
