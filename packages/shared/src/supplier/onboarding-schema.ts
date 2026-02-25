import { z } from "zod";

import { cnpjSchema } from "../company/cnpj";

function normalizeDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export interface SupplierCompanyProfile {
  cnpj: string;
  legalName: string;
  tradeName: string;
  legalRepresentativeName?: string;
  contactPhone?: string;
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  district?: string;
  email?: string;
  city: string;
  state: string;
}

export const supplierOnboardingSchema = z.object({
  cnpj: cnpjSchema,
});

export type SupplierOnboardingInput = z.infer<typeof supplierOnboardingSchema>;

export const supplierSignupSchema = z.object({
  cnpj: cnpjSchema,
  legalName: z.string().trim().min(2, "Informe a razão social"),
  tradeName: z.string().trim().min(2, "Informe o nome fantasia"),
  legalRepresentativeName: z
    .string()
    .trim()
    .min(3, "Informe o nome do responsável legal"),
  contactPhone: z
    .string()
    .trim()
    .transform((value) => normalizeDigits(value))
    .refine((value) => value.length >= 10 && value.length <= 11, "Informe um telefone válido"),
  zipCode: z
    .string()
    .trim()
    .transform((value) => normalizeDigits(value))
    .refine((value) => value.length === 8, "Informe um CEP válido"),
  street: z.string().trim().min(3, "Informe o logradouro"),
  number: z.string().trim().min(1, "Informe o número"),
  complement: z.string().trim().optional(),
  district: z.string().trim().min(2, "Informe o bairro"),
  city: z.string().trim().min(2, "Informe a cidade"),
  state: z
    .string()
    .trim()
    .length(2, "UF deve ter 2 caracteres")
    .transform((value) => value.toUpperCase()),
  email: z.string().trim().email("Informe um e-mail válido"),
  password: z
    .string()
    .min(8, "A senha deve ter no mínimo 8 caracteres")
    .max(64, "A senha deve ter no máximo 64 caracteres"),
});

export type SupplierSignupInput = z.infer<typeof supplierSignupSchema>;
