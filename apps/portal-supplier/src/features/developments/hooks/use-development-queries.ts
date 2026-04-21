import { useMutation, useQuery } from "@tanstack/react-query";

import { useAuth } from "@/app/providers/auth-provider";
import {
  createBuyer,
  createDevelopment,
  deleteDevelopment,
  getDevelopmentApiCapabilities,
  getBuyerDetail,
  getDevelopmentDetail,
  getSupplierWorkflowProcessDetail,
  listDevelopments,
  updateSupplierContractControl,
  updateSupplierDocumentStatus,
  uploadSupplierContractDocument,
  updateBuyer,
  updateDevelopment,
} from "@/features/developments/api/developments-api";
import type { SupplierDevelopmentCreateFormValues } from "@/features/developments/core/development-create-schema";
import type { BuyerRegistrationFormValues, BuyerUpdateFormValues } from "@/features/developments/core/developments-schema";
import type { DevelopmentRegistrationFormValues } from "@registra/shared";

const DEVELOPMENTS_QUERY_STALE_TIME = 5 * 60 * 1000;

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
    staleTime: DEVELOPMENTS_QUERY_STALE_TIME,
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
    staleTime: DEVELOPMENTS_QUERY_STALE_TIME,
  });
}

export function useDevelopmentBuyerDetailQuery(developmentId: string | null, buyerId: string | null) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["supplier", "developments", developmentId, "buyers", "detail", buyerId],
    queryFn: async () => {
      if (!session?.token || !buyerId) {
        throw new Error("Sessão inválida para detalhar comprador.");
      }

      return getBuyerDetail({
        token: session.token,
        developmentId,
        buyerId,
      });
    },
    enabled: Boolean(session?.token && buyerId),
    staleTime: DEVELOPMENTS_QUERY_STALE_TIME,
  });
}

export function useSupplierWorkflowProcessDetailQuery(processId: string | null) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["supplier", "workflow-processes", "detail", processId],
    queryFn: async () => {
      if (!session?.token || !processId) {
        throw new Error("Sessão inválida para detalhar processo.");
      }

      return getSupplierWorkflowProcessDetail({
        token: session.token,
        processId,
      });
    },
    enabled: Boolean(session?.token && processId),
    staleTime: DEVELOPMENTS_QUERY_STALE_TIME,
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

export function useUpdateBuyerMutation(buyerId: string) {
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (values: BuyerUpdateFormValues) => {
      if (!session?.token) {
        throw new Error("Sessão inválida para atualizar comprador.");
      }

      return updateBuyer({
        token: session.token,
        buyerId,
        values,
      });
    },
  });
}

export function useUploadSupplierContractDocumentMutation(processId: string) {
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!session?.token) {
        throw new Error("Sessão inválida para enviar o contrato.");
      }

      return uploadSupplierContractDocument({
        token: session.token,
        processId,
        file,
      });
    },
  });
}

export function useUpdateSupplierDocumentStatusMutation() {
  const { session } = useAuth();

  return useMutation({
    mutationFn: async ({
      documentId,
      status,
      comments,
    }: {
      documentId: string;
      status: "uploaded" | "under_review" | "approved" | "rejected" | "replaced";
      comments?: string | null;
    }) => {
      if (!session?.token) {
        throw new Error("Sessão inválida para atualizar o documento.");
      }

      return updateSupplierDocumentStatus({
        token: session.token,
        documentId,
        status,
        comments,
      });
    },
  });
}

export function useUpdateSupplierContractControlMutation(processId: string) {
  const { session } = useAuth();

  return useMutation({
    mutationFn: async ({
      stageId,
      contractControlStatus,
      signatureUrl,
    }: {
      stageId: string;
      contractControlStatus:
        | "pending_generation"
        | "awaiting_document_upload"
        | "awaiting_signature"
        | "signed"
        | "completed"
        | "cancelled";
      signatureUrl?: string | null;
    }) => {
      if (!session?.token) {
        throw new Error("Sessão inválida para atualizar o controle do contrato.");
      }

      return updateSupplierContractControl({
        token: session.token,
        processId,
        stageId,
        contractControlStatus,
        signatureUrl,
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
