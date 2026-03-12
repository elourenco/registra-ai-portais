import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { z } from "zod";

import { useAuth } from "@/app/providers/auth-provider";
import { getSupplierDetail } from "@/features/suppliers/api/suppliers-api";
import { retryWithoutUnauthorized } from "@/shared/api/query-retry";

const supplierIdParamSchema = z.string().trim().min(1);

export function useSupplierDetailQuery(initialSupplierId?: string | null) {
  const { session } = useAuth();
  const params = useParams();

  const supplierId = useMemo(() => {
    const parsed = supplierIdParamSchema.safeParse(initialSupplierId ?? params.supplierId);
    return parsed.success ? parsed.data : null;
  }, [initialSupplierId, params.supplierId]);

  const supplierQuery = useQuery({
    queryKey: ["suppliers", "detail", session?.user.id, supplierId],
    queryFn: async () => {
      if (!session?.token || !supplierId) {
        throw new Error("Sessão inválida para carregar detalhe do supplier.");
      }

      return getSupplierDetail({
        token: session.token,
        supplierId,
      });
    },
    enabled: Boolean(session?.token && supplierId),
    retry: retryWithoutUnauthorized,
  });

  return {
    supplierId,
    supplierQuery,
  };
}
