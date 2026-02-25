import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido"),
  password: z
    .string()
    .min(8, "A senha deve ter no mínimo 8 caracteres")
    .max(64, "A senha deve ter no máximo 64 caracteres"),
});

export type LoginInput = z.infer<typeof loginSchema>;
