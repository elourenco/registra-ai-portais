import { useMutation } from "@tanstack/react-query";

import { useAuth } from "@/app/providers/auth-provider";
import { createDevelopment } from "@/features/developments/api/developments-api";

export function useCreateDevelopmentMutation() {
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (input: Parameters<typeof createDevelopment>[0]["input"]) => {
      if (!session?.token) {
        throw new Error("Sessão inválida para cadastrar empreendimento.");
      }

      return createDevelopment({
        input,
        token: session.token,
      });
    },
  });
}
