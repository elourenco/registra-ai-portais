import { z } from "zod";

export const customerLoginSchema = z.object({
  identifierType: z.enum(["cpf", "cnpj"]),
  documentNumber: z
    .string()
    .trim()
    .min(1, "Informe um documento válido."),
  accessCode: z
    .string()
    .trim()
    .min(4, "Informe o código de acesso."),
}).superRefine((value, ctx) => {
  const digits = value.documentNumber.replace(/\D/g, "");

  if (value.identifierType === "cpf" && digits.length !== 11) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["documentNumber"],
      message: "Informe um CPF válido.",
    });
  }

  if (value.identifierType === "cnpj" && digits.length !== 14) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["documentNumber"],
      message: "Informe um CNPJ válido.",
    });
  }
}).transform((value) => ({
  ...value,
  documentNumber: value.documentNumber.replace(/\D/g, ""),
}));

export type CustomerLoginInput = z.input<typeof customerLoginSchema>;
export type CustomerLoginPayload = z.output<typeof customerLoginSchema>;
