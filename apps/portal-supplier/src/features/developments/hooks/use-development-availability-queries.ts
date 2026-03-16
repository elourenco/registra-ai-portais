import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateAvailabilityItemInput,
  GenerateAvailabilityInput,
  UpdateAvailabilityItemInput,
} from "@registra/shared";

import { useAuth } from "@/app/providers/auth-provider";
import {
  createAvailabilityItem,
  deleteAvailabilityItem,
  generateDevelopmentAvailability,
  getDevelopmentAvailability,
  updateAvailabilityItem,
} from "@/features/developments/api/development-availability-api";

export function useDevelopmentAvailabilityQuery(
  developmentId: string | null,
  search?: string,
) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["supplier", "developments", "availability", developmentId, search ?? ""],
    queryFn: async () => {
      if (!session?.token || !developmentId) {
        throw new Error("Empreendimento inválido para consultar disponibilidade.");
      }

      return getDevelopmentAvailability({
        developmentId,
        token: session.token,
        search,
      });
    },
    enabled: Boolean(session?.token && developmentId),
  });
}

export function useGenerateDevelopmentAvailabilityMutation(developmentId: string) {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: GenerateAvailabilityInput) => {
      if (!session?.token) {
        throw new Error("Sessão inválida para gerar a volumetria.");
      }

      return generateDevelopmentAvailability({ developmentId, token: session.token, input });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["supplier", "developments", "availability", developmentId],
        exact: false,
      });
    },
  });
}

export function useCreateAvailabilityItemMutation(developmentId: string) {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAvailabilityItemInput) => {
      if (!session?.token) {
        throw new Error("Sessão inválida para criar item de volumetria.");
      }

      return createAvailabilityItem({
        developmentId,
        token: session.token,
        input,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["supplier", "developments", "availability", developmentId],
        exact: false,
      });
    },
  });
}

export function useUpdateAvailabilityItemMutation(developmentId: string) {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, input }: { itemId: string; input: UpdateAvailabilityItemInput }) => {
      if (!session?.token) {
        throw new Error("Sessão inválida para atualizar item de volumetria.");
      }

      return updateAvailabilityItem({
        developmentId,
        itemId,
        token: session.token,
        input,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["supplier", "developments", "availability", developmentId],
        exact: false,
      });
    },
  });
}

export function useDeleteAvailabilityItemMutation(developmentId: string) {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      if (!session?.token) {
        throw new Error("Sessão inválida para excluir item de volumetria.");
      }

      return deleteAvailabilityItem({
        developmentId,
        itemId,
        token: session.token,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["supplier", "developments", "availability", developmentId],
        exact: false,
      });
    },
  });
}
