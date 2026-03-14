import {
  brazilStateSchema,
  isValidCnpj,
  type BrazilState,
} from "@registra/shared";
import { z } from "zod";

export const supplierDevelopmentLandProfileSchema = z.enum(["urban", "rural"]);
export const supplierDevelopmentModalitySchema = z.enum([
  "commercial",
  "residential",
  "studio",
]);

export type SupplierDevelopmentLandProfile = z.infer<
  typeof supplierDevelopmentLandProfileSchema
>;
export type SupplierDevelopmentModality = z.infer<
  typeof supplierDevelopmentModalitySchema
>;

export const supplierDevelopmentLandProfileLabels: Record<
  SupplierDevelopmentLandProfile,
  string
> = {
  urban: "Urbano",
  rural: "Rural",
};

export const supplierDevelopmentModalityLabels: Record<
  SupplierDevelopmentModality,
  string
> = {
  commercial: "Comercial",
  residential: "Residencial",
  studio: "Studio",
};

export const supplierDevelopmentCreateFormSchema = z.object({
  legalName: z.string().trim().min(2, "Informe a razão social."),
  tradeName: z.string().trim().min(2, "Informe o nome fantasia."),
  speCnpj: z
    .string()
    .trim()
    .min(1, "Informe o número do CNPJ.")
    .refine((value) => isValidCnpj(value), "Informe um CNPJ válido."),
  name: z.string().trim().min(2, "Informe o nome do empreendimento."),
  postalCode: z.string().trim().min(9, "Informe o CEP."),
  address: z.string().trim().min(4, "Informe o endereço do empreendimento."),
  number: z.string().trim().min(1, "Informe o número."),
  complement: z.string().trim().optional(),
  neighborhood: z.string().trim().min(2, "Informe o bairro."),
  city: z.string().trim().min(2, "Informe a cidade."),
  state: brazilStateSchema,
  totalTowers: z.coerce.number().int().min(1, "Informe a quantidade de torres."),
  totalUnits: z.coerce.number().int().min(1, "Informe a quantidade de unidades."),
  largerAreaContributorNote: z
    .string()
    .trim()
    .max(240, "Use no máximo 240 caracteres.")
    .optional(),
  landProfile: supplierDevelopmentLandProfileSchema,
  developmentModality: supplierDevelopmentModalitySchema,
});

export type SupplierDevelopmentCreateFormInput = z.input<
  typeof supplierDevelopmentCreateFormSchema
>;
export type SupplierDevelopmentCreateFormValues = z.output<
  typeof supplierDevelopmentCreateFormSchema
>;

export interface CreateDevelopmentRequestDraft {
  supplierId?: string | null;
  legalName: string;
  tradeName: string;
  speCnpj: string;
  name: string;
  postalCode: string;
  address: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: BrazilState;
  totalTowers: number;
  totalUnits: number;
  landProfile: SupplierDevelopmentLandProfile;
  developmentModality: SupplierDevelopmentModality;
  largerAreaContributorNote?: string;
  developmentType: "commercial" | "residential" | null;
  status: "drafting";
}

export function toCreateDevelopmentRequestDraft(
  values: SupplierDevelopmentCreateFormValues,
  supplierId?: string | null,
): CreateDevelopmentRequestDraft {
  return {
    supplierId,
    legalName: values.legalName,
    tradeName: values.tradeName,
    speCnpj: values.speCnpj,
    name: values.name,
    postalCode: values.postalCode,
    address: values.address,
    number: values.number,
    complement: values.complement,
    neighborhood: values.neighborhood,
    city: values.city,
    state: values.state,
    totalTowers: values.totalTowers,
    totalUnits: values.totalUnits,
    landProfile: values.landProfile,
    developmentModality: values.developmentModality,
    largerAreaContributorNote: values.largerAreaContributorNote,
    developmentType:
      values.developmentModality === "studio" ? null : values.developmentModality,
    status: "drafting",
  };
}
