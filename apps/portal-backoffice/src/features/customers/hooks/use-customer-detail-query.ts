import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/app/providers/auth-provider";
import { getCustomerDetail } from "@/features/customers/api/customers-api";
import { retryWithoutUnauthorized } from "@/shared/api/query-retry";

const customerIdParamSchema = z.string().trim().min(1);

export function useCustomerDetailQuery() {
  const { session } = useAuth();
  const params = useParams();

  const customerId = useMemo(() => {
    const parsed = customerIdParamSchema.safeParse(params.customerId);
    return parsed.success ? parsed.data : null;
  }, [params.customerId]);

  const customerQuery = useQuery({
    queryKey: ["customers", "detail", session?.user.id, customerId],
    queryFn: async () => {
      if (!session?.token || !customerId) {
        throw new Error("Sessão inválida para carregar detalhe do customer.");
      }

      return getCustomerDetail({
        token: session.token,
        customerId,
      });
    },
    enabled: Boolean(session?.token && customerId),
    retry: retryWithoutUnauthorized,
  });

  return {
    customerId,
    customerQuery,
  };
}
