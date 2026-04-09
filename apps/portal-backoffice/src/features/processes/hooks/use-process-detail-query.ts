import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { z } from "zod";

import { useAuth } from "@/app/providers/auth-provider";
import { getProcessOperationalDetail } from "@/features/processes/api/process-operational-api";
import { getProcessDetail } from "@/features/processes/api/processes-api";
import { retryWithoutUnauthorized } from "@/shared/api/query-retry";

const processIdParamSchema = z.string().trim().min(1);
const supplierIdParamSchema = z.string().trim().min(1);

type ProcessDetailQueryResult = {
  detail: Awaited<ReturnType<typeof getProcessDetail>>;
  operational: Awaited<ReturnType<typeof getProcessOperationalDetail>>;
};

export function useProcessDetailQuery() {
  const { session } = useAuth();
  const params = useParams<{ processId: string; supplierId?: string }>();

  const processId = useMemo(() => {
    const parsed = processIdParamSchema.safeParse(params.processId);
    return parsed.success ? parsed.data : null;
  }, [params.processId]);

  const supplierId = useMemo(() => {
    const parsed = supplierIdParamSchema.safeParse(params.supplierId);
    return parsed.success ? parsed.data : undefined;
  }, [params.supplierId]);

  const processQuery = useQuery<ProcessDetailQueryResult>({
    queryKey: ["processes", "detail", session?.user.id, supplierId ?? null, processId],
    queryFn: async () => {
      if (!processId) {
        throw new Error("Processo inválido.");
      }

      if (!session?.token) {
        throw new Error("Sessão inválida para carregar o processo.");
      }

      const [detail, operational] = await Promise.all([
        getProcessDetail({
          token: session.token,
          processId,
          supplierId,
        }),
        getProcessOperationalDetail({
          token: session.token,
          processId,
        }),
      ]);

      return {
        detail,
        operational,
      };
    },
    enabled: Boolean(session?.token && processId),
    retry: retryWithoutUnauthorized,
  });

  return {
    processId,
    supplierId,
    processQuery,
  };
}
