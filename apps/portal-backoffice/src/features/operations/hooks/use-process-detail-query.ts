import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { fetchProcessDetail } from "@/features/operations/api/operations-api";

const processIdParamSchema = z.string().trim().min(1);

export function useProcessDetailQuery() {
  const params = useParams<{ processId: string }>();

  const processId = useMemo(() => {
    const parsed = processIdParamSchema.safeParse(params.processId);
    return parsed.success ? parsed.data : null;
  }, [params.processId]);

  const processQuery = useQuery({
    queryKey: ["operations", "process-detail", processId],
    queryFn: () => {
      if (!processId) {
        throw new Error("Processo inválido.");
      }

      return fetchProcessDetail(processId);
    },
    enabled: Boolean(processId),
  });

  return {
    processId,
    processQuery,
  };
}
