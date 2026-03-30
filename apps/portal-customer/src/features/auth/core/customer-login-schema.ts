import { z } from "zod";

export const customerLoginSchema = z.object({
  documentNumber: z
    .string()
    .trim()
    .min(1, "Informe um documento válido."),
  accessCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Informe o código de acesso com 6 dígitos."),
}).superRefine((value, ctx) => {
  const digits = value.documentNumber.replace(/\D/g, "");

  if (digits.length !== 11) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["documentNumber"],
      message: "Informe um CPF válido.",
    });
  }
}).transform((value) => ({
  ...value,
  documentNumber: value.documentNumber.replace(/\D/g, ""),
}));

export type CustomerLoginInput = z.input<typeof customerLoginSchema>;
export type CustomerLoginPayload = z.output<typeof customerLoginSchema>;
