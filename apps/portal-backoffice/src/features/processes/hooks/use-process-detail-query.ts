import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { z } from "zod";

import { useAuth } from "@/app/providers/auth-provider";
import { getProcessDetail } from "@/features/processes/api/processes-api";
import { fetchRegistrationProcessDetailMock } from "@/features/registration-core/api/registration-workspace-api";
import { ApiClientError } from "@/shared/api/http-client";
import { retryWithoutUnauthorized } from "@/shared/api/query-retry";

const processIdParamSchema = z.string().trim().min(1);
const supplierIdParamSchema = z.string().trim().min(1);

type ProcessDetailQueryResult =
  | {
      source: "api";
      data: Awaited<ReturnType<typeof getProcessDetail>>;
    }
  | {
      source: "mock";
      data: Awaited<ReturnType<typeof fetchRegistrationProcessDetailMock>>;
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

      try {
        const data = await getProcessDetail({
          token: session.token,
          processId,
          supplierId,
        });

        return {
          source: "api",
          data,
        };
      } catch (error) {
        if (error instanceof ApiClientError && error.status !== 404) {
          throw error;
        }

        return {
          source: "mock",
          data: await fetchRegistrationProcessDetailMock(processId),
        };
      }
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
