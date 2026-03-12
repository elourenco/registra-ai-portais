import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { fetchRegistrationProcessDetailMock } from "@/features/registration-core/api/registration-workspace-api";
import { useRegistrationWorkspaceQuery } from "@/features/registration-core/hooks/use-registration-workspace-query";

const buyerIdParamSchema = z.string().trim().min(1);

export function useBuyerDetailQuery() {
  const params = useParams<{ buyerId: string }>();
  const workspaceQuery = useRegistrationWorkspaceQuery();

  const buyerId = useMemo(() => {
    const parsed = buyerIdParamSchema.safeParse(params.buyerId);
    return parsed.success ? parsed.data : null;
  }, [params.buyerId]);

  const buyer = useMemo(
    () => workspaceQuery.data?.buyers.find((item) => item.id === buyerId) ?? null,
    [buyerId, workspaceQuery.data?.buyers],
  );

  const development = useMemo(
    () => workspaceQuery.data?.developments.find((item) => item.id === buyer?.developmentId) ?? null,
    [buyer?.developmentId, workspaceQuery.data?.developments],
  );

  const supplier = useMemo(
    () => workspaceQuery.data?.suppliers.find((item) => item.id === buyer?.supplierId) ?? null,
    [buyer?.supplierId, workspaceQuery.data?.suppliers],
  );

  const process = useMemo(
    () => workspaceQuery.data?.processes.find((item) => item.id === buyer?.processId) ?? null,
    [buyer?.processId, workspaceQuery.data?.processes],
  );

  const processDetailQuery = useQuery({
    queryKey: ["buyers", "process-detail", process?.id, "mock"],
    queryFn: () => {
      if (!process?.id) {
        throw new Error("Processo do comprador não encontrado.");
      }

      return fetchRegistrationProcessDetailMock(process.id);
    },
    enabled: Boolean(process?.id),
  });

  return {
    buyerId,
    buyer,
    development,
    supplier,
    process,
    workspaceQuery,
    processDetailQuery,
  };
}
