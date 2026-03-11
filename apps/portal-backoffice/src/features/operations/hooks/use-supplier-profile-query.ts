import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { z } from "zod";

import { useOperationsWorkspaceQuery } from "@/features/operations/hooks/use-operations-workspace-query";

const supplierIdParamSchema = z.string().trim().min(1);

export function useSupplierProfileQuery() {
  const params = useParams<{ supplierId: string }>();
  const workspaceQuery = useOperationsWorkspaceQuery();

  const supplierId = useMemo(() => {
    const parsed = supplierIdParamSchema.safeParse(params.supplierId);
    return parsed.success ? parsed.data : null;
  }, [params.supplierId]);

  const supplier = useMemo(
    () => workspaceQuery.data?.suppliers.find((item) => item.id === supplierId) ?? null,
    [supplierId, workspaceQuery.data?.suppliers],
  );

  const developments = useMemo(
    () => workspaceQuery.data?.developments.filter((item) => item.supplierId === supplierId) ?? [],
    [supplierId, workspaceQuery.data?.developments],
  );

  const buyersCount = useMemo(
    () =>
      workspaceQuery.data?.buyers.filter((item) => item.supplierId === supplierId).length ?? 0,
    [supplierId, workspaceQuery.data?.buyers],
  );

  const processesCount = useMemo(
    () =>
      workspaceQuery.data?.processes.filter((item) => item.supplierId === supplierId).length ?? 0,
    [supplierId, workspaceQuery.data?.processes],
  );

  return {
    supplierId,
    supplier,
    developments,
    buyersCount,
    processesCount,
    workspaceQuery,
  };
}
