import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { z } from "zod";

import { useAuth } from "@/app/providers/auth-provider";
import { getSupplierDevelopmentContext } from "@/features/suppliers/api/suppliers-api";
import { useSupplierDetailQuery } from "@/features/suppliers/hooks/use-supplier-detail-query";
import { useRegistrationWorkspaceQuery } from "@/features/registration-core/hooks/use-registration-workspace-query";
import { retryWithoutUnauthorized } from "@/shared/api/query-retry";

const developmentIdParamSchema = z.string().trim().min(1);
const supplierIdParamSchema = z.string().trim().min(1);

export function useDevelopmentDetailQuery() {
  const { session } = useAuth();
  const params = useParams<{ developmentId: string; supplierId?: string }>();
  const workspaceQuery = useRegistrationWorkspaceQuery();
  const { supplierQuery } = useSupplierDetailQuery(params.supplierId ?? null);

  const developmentId = useMemo(() => {
    const parsed = developmentIdParamSchema.safeParse(params.developmentId);
    return parsed.success ? parsed.data : null;
  }, [params.developmentId]);

  const supplierId = useMemo(() => {
    const parsed = supplierIdParamSchema.safeParse(params.supplierId);
    return parsed.success ? parsed.data : null;
  }, [params.supplierId]);

  const supplierDevelopmentContextQuery = useQuery({
    queryKey: ["developments", "detail", session?.user.id, supplierId, developmentId],
    queryFn: async () => {
      if (!session?.token || !developmentId) {
        throw new Error("Sessão inválida para carregar o detalhe do empreendimento.");
      }

      return getSupplierDevelopmentContext({
        developmentId,
        token: session.token,
      });
    },
    enabled: Boolean(session?.token && supplierId && developmentId),
    retry: retryWithoutUnauthorized,
  });

  const isSupplierScoped = Boolean(supplierId);

  const development = useMemo(() => {
    if (isSupplierScoped) {
      return supplierDevelopmentContextQuery.data?.development ?? null;
    }

    return workspaceQuery.data?.developments.find((item) => item.id === developmentId) ?? null;
  }, [
    developmentId,
    isSupplierScoped,
    supplierDevelopmentContextQuery.data?.development,
    workspaceQuery.data?.developments,
  ]);

  const supplier = useMemo(() => {
    if (isSupplierScoped) {
      const supplierData = supplierQuery.data;

      if (!supplierData) {
        return null;
      }

      return {
        id: supplierData.id,
        name: supplierData.legalName,
        cnpj: supplierData.cnpj,
      };
    }

    return workspaceQuery.data?.suppliers.find((item) => item.id === development?.supplierId) ?? null;
  }, [development?.supplierId, isSupplierScoped, supplierQuery.data, workspaceQuery.data?.suppliers]);

  const buyers = useMemo(() => {
    if (isSupplierScoped) {
      return supplierDevelopmentContextQuery.data?.buyers ?? [];
    }

    return workspaceQuery.data?.buyers.filter((item) => item.developmentId === developmentId) ?? [];
  }, [developmentId, isSupplierScoped, supplierDevelopmentContextQuery.data?.buyers, workspaceQuery.data?.buyers]);

  const processes = useMemo(() => {
    if (isSupplierScoped) {
      return supplierDevelopmentContextQuery.data?.processes ?? [];
    }

    return workspaceQuery.data?.processes.filter((item) => item.developmentId === developmentId) ?? [];
  }, [
    developmentId,
    isSupplierScoped,
    supplierDevelopmentContextQuery.data?.processes,
    workspaceQuery.data?.processes,
  ]);

  return {
    developmentId,
    supplierId,
    development,
    supplier,
    buyers,
    processes,
    workspaceQuery,
    supplierQuery,
    detailQuery: isSupplierScoped ? supplierDevelopmentContextQuery : workspaceQuery,
    isSupplierScoped,
  };
}
