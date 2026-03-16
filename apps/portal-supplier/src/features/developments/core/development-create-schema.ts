import {
  brazilStateSchema,
  isValidCnpj,
  type BrazilState,
} from "@registra/shared";
import { z } from "zod";

export const supplierDevelopmentTypeSchema = z.enum([
  "incorporacao_vertical",
  "incorporacao_horizontal",
  "loteamento",
  "condominio_lotes",
]);

export const supplierDevelopmentModalitySchema = z.enum([
  "mcmv",
  "sbpe",
  "associativo",
  "terreno_construcao",
  "direto_construtora",
]);

export type SupplierDevelopmentType = z.infer<
  typeof supplierDevelopmentTypeSchema
>;
export type SupplierDevelopmentModality = z.infer<
  typeof supplierDevelopmentModalitySchema
>;

export const supplierDevelopmentTypeLabels: Record<
  SupplierDevelopmentType,
  string
> = {
  incorporacao_vertical: "Incorporação Vertical",
  incorporacao_horizontal: "Incorporação Horizontal",
  loteamento: "Loteamento",
  condominio_lotes: "Condomínio de Lotes",
};

export const supplierDevelopmentModalityLabels: Record<
  SupplierDevelopmentModality,
  string
> = {
  mcmv: "Minha Casa Minha Vida",
  sbpe: "SBPE",
  associativo: "Crédito Associativo",
  terreno_construcao: "Aquisição de Terreno e Construção",
  direto_construtora: "Direto com a Construtora",
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
  totalTowers: z.coerce.number().int().optional(),
  totalUnits: z.coerce.number().int().optional(),
  unitsPerFloor: z.coerce.number().int().optional(),
  totalFloors: z.coerce.number().int().optional(),
  totalBlocks: z.coerce.number().int().optional(),
  totalLots: z.coerce.number().int().optional(),
  largerAreaContributorNote: z
    .string()
    .trim()
    .max(240, "Use no máximo 240 caracteres.")
    .optional(),
  developmentType: supplierDevelopmentTypeSchema,
  developmentModality: supplierDevelopmentModalitySchema,
}).superRefine((data, ctx) => {
  if (data.developmentType === "incorporacao_vertical") {
    if (!data.totalTowers || data.totalTowers < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe a quantidade de torres.",
        path: ["totalTowers"],
      });
    }
    if (!data.totalUnits || data.totalUnits < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe a quantidade total de unidades.",
        path: ["totalUnits"],
      });
    }
  }

  if (data.developmentType === "incorporacao_horizontal") {
    if (!data.totalUnits || data.totalUnits < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe a quantidade total de unidades/casas.",
        path: ["totalUnits"],
      });
    }
  }

  if (
    data.developmentType === "loteamento" ||
    data.developmentType === "condominio_lotes"
  ) {
    if (!data.totalLots || data.totalLots < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe a quantidade total de lotes.",
        path: ["totalLots"],
      });
    }
  }
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
  totalTowers?: number;
  totalUnits?: number;
  unitsPerFloor?: number;
  totalFloors?: number;
  totalBlocks?: number;
  totalLots?: number;
  developmentType: SupplierDevelopmentType;
  developmentModality: SupplierDevelopmentModality;
  largerAreaContributorNote?: string;
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
    unitsPerFloor: values.unitsPerFloor,
    totalFloors: values.totalFloors,
    totalBlocks: values.totalBlocks,
    totalLots: values.totalLots,
    developmentType: values.developmentType,
    developmentModality: values.developmentModality,
    largerAreaContributorNote: values.largerAreaContributorNote,
    status: "drafting",
  };
}
