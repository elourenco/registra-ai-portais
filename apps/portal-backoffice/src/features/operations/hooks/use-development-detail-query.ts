import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { z } from "zod";

import { useOperationsWorkspaceQuery } from "@/features/operations/hooks/use-operations-workspace-query";

const developmentIdParamSchema = z.string().trim().min(1);

export function useDevelopmentDetailQuery() {
  const params = useParams<{ developmentId: string }>();
  const workspaceQuery = useOperationsWorkspaceQuery();

  const developmentId = useMemo(() => {
    const parsed = developmentIdParamSchema.safeParse(params.developmentId);
    return parsed.success ? parsed.data : null;
  }, [params.developmentId]);

  const development = useMemo(
    () => workspaceQuery.data?.developments.find((item) => item.id === developmentId) ?? null,
    [developmentId, workspaceQuery.data?.developments],
  );

  const supplier = useMemo(
    () =>
      workspaceQuery.data?.suppliers.find((item) => item.id === development?.supplierId) ?? null,
    [development?.supplierId, workspaceQuery.data?.suppliers],
  );

  const buyers = useMemo(
    () => workspaceQuery.data?.buyers.filter((item) => item.developmentId === developmentId) ?? [],
    [developmentId, workspaceQuery.data?.buyers],
  );

  const processes = useMemo(
    () =>
      workspaceQuery.data?.processes.filter((item) => item.developmentId === developmentId) ?? [],
    [developmentId, workspaceQuery.data?.processes],
  );

  return {
    developmentId,
    development,
    supplier,
    buyers,
    processes,
    workspaceQuery,
  };
}
