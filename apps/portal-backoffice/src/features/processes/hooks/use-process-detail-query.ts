import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { fetchRegistrationProcessDetailMock } from "@/features/registration-core/api/registration-workspace-api";

const processIdParamSchema = z.string().trim().min(1);

export function useProcessDetailQuery() {
  const params = useParams<{ processId: string }>();

  const processId = useMemo(() => {
    const parsed = processIdParamSchema.safeParse(params.processId);
    return parsed.success ? parsed.data : null;
  }, [params.processId]);

  const processQuery = useQuery({
    queryKey: ["processes", "detail", processId, "mock"],
    queryFn: () => {
      if (!processId) {
        throw new Error("Processo inválido.");
      }

      return fetchRegistrationProcessDetailMock(processId);
    },
    enabled: Boolean(processId),
  });

  return {
    processId,
    processQuery,
  };
}
