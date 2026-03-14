import { useMutation, useQuery } from "@tanstack/react-query";

import { useAuth } from "@/app/providers/auth-provider";
import {
  createBuyer,
  createDevelopment,
  deleteDevelopment,
  getDevelopmentApiCapabilities,
  getDevelopmentDetail,
  listDevelopments,
  updateDevelopment,
} from "@/features/developments/api/developments-api";
import type { SupplierDevelopmentCreateFormValues } from "@/features/developments/core/development-create-schema";
import type { BuyerRegistrationFormValues } from "@/features/developments/core/developments-schema";
import type { DevelopmentRegistrationFormValues } from "@registra/shared";

export function useDevelopmentsQuery(search?: string) {
  const { session } = useAuth();
  const supplierId = session?.user.supplierCompanyId ?? null;

  return useQuery({
    queryKey: ["supplier", "developments", supplierId, search ?? ""],
    queryFn: async () => {
      if (!session?.token) {
        throw new Error("Sessão inválida para listar empreendimentos.");
      }

      return listDevelopments({
        token: session.token,
        supplierId,
        search,
      });
    },
    enabled: Boolean(session?.token),
  });
}

export function useDevelopmentDetailQuery(developmentId: string | null) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["supplier", "developments", "detail", developmentId],
    queryFn: async () => {
      if (!session?.token || !developmentId) {
        throw new Error("Sessão inválida para detalhar empreendimento.");
      }

      return getDevelopmentDetail({
        token: session.token,
        developmentId,
      });
    },
    enabled: Boolean(session?.token && developmentId),
  });
}

export function useCreateDevelopmentMutation() {
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (values: SupplierDevelopmentCreateFormValues) => {
      if (!session?.token) {
        throw new Error("Sessão inválida para cadastrar empreendimento.");
      }

      return createDevelopment({
        token: session.token,
        supplierId: session.user.supplierCompanyId ?? null,
        values,
      });
    },
  });
}

export function useCreateBuyerMutation(developmentId: string) {
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (values: BuyerRegistrationFormValues) => {
      if (!session?.token) {
        throw new Error("Sessão inválida para cadastrar comprador.");
      }

      return createBuyer({
        token: session.token,
        supplierId: session.user.supplierCompanyId ?? null,
        developmentId,
        values,
      });
    },
  });
}

export function useUpdateDevelopmentMutation(developmentId: string) {
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (values: DevelopmentRegistrationFormValues) => {
      if (!session?.token) {
        throw new Error("Sessão inválida para atualizar empreendimento.");
      }

      if (!getDevelopmentApiCapabilities().canUpdateDevelopment) {
        throw new Error(
          "Update de empreendimento desabilitado por configuração local.",
        );
      }

      return updateDevelopment({
        token: session.token,
        developmentId,
        supplierId: session.user.supplierCompanyId ?? null,
        values,
      });
    },
  });
}

export function useDeleteDevelopmentMutation(developmentId: string) {
  const { session } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!session?.token) {
        throw new Error("Sessão inválida para excluir empreendimento.");
      }

      if (!getDevelopmentApiCapabilities().canDeleteDevelopment) {
        throw new Error(
          "Delete de empreendimento desabilitado por configuração local.",
        );
      }

      return deleteDevelopment({
        token: session.token,
        developmentId,
      });
    },
  });
}
