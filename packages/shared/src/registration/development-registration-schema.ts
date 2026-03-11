import { z } from "zod";

import { isValidCnpj } from "../company/cnpj";
import { normalizeDigits } from "./user-registration-schema";

export const brazilStateSchema = z.enum([
  "AC",
  "AL",
  "AM",
  "AP",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MG",
  "MS",
  "MT",
  "PA",
  "PB",
  "PE",
  "PI",
  "PR",
  "RJ",
  "RN",
  "RO",
  "RR",
  "RS",
  "SC",
  "SE",
  "SP",
  "TO",
]);
export type BrazilState = z.infer<typeof brazilStateSchema>;

export const developmentRegistrationTypeSchema = z.enum([
  "residential",
  "commercial",
  "mixed",
  "land_subdivision",
]);
export type DevelopmentRegistrationType = z.infer<typeof developmentRegistrationTypeSchema>;

export const developmentRegistrationStatusSchema = z.enum([
  "drafting",
  "commercialization",
  "registry",
  "completed",
]);
export type DevelopmentRegistrationStatus = z.infer<typeof developmentRegistrationStatusSchema>;

export const developmentRegistrationTypeLabels: Record<DevelopmentRegistrationType, string> = {
  residential: "Residencial",
  commercial: "Comercial",
  mixed: "Misto",
  land_subdivision: "Loteamento",
};

export const developmentRegistrationStatusLabels: Record<DevelopmentRegistrationStatus, string> = {
  drafting: "Em cadastro",
  commercialization: "Em comercialização",
  registry: "Em registro",
  completed: "Concluído",
};

export const brazilStateOptions = brazilStateSchema.options;

const cepDatabase = {
  "04538132": {
    address: "Avenida Engenheiro Luís Carlos Berrini",
    neighborhood: "Cidade Monções",
    city: "São Paulo",
    state: "SP",
  },
  "30140071": {
    address: "Avenida do Contorno",
    neighborhood: "Funcionários",
    city: "Belo Horizonte",
    state: "MG",
  },
  "20040020": {
    address: "Rua da Assembleia",
    neighborhood: "Centro",
    city: "Rio de Janeiro",
    state: "RJ",
  },
} satisfies Record<
  string,
  {
    address: string;
    neighborhood: string;
    city: string;
    state: BrazilState;
  }
>;

export type CepLookupResult = (typeof cepDatabase)[keyof typeof cepDatabase] | null;

export function lookupCep(cep: string): CepLookupResult {
  const normalizedCep = normalizeDigits(cep);
  return cepDatabase[normalizedCep as keyof typeof cepDatabase] ?? null;
}

export const developmentRegistrationFormSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do empreendimento."),
  developmentType: developmentRegistrationTypeSchema,
  speCnpj: z
    .string()
    .trim()
    .min(1, "Informe o CNPJ do empreendimento.")
    .refine((value) => isValidCnpj(value), "Informe um CNPJ válido."),
  legalName: z.string().trim().min(2, "Informe a razão social do empreendimento."),
  tradeName: z.string().trim().optional(),
  supplierId: z.string().trim().optional(),
  supplierCustomName: z.string().trim().optional(),
  incorporationRegistrationNumber: z
    .string()
    .trim()
    .min(2, "Informe o número do registro da incorporação."),
  incorporationRegistrationDate: z
    .string()
    .trim()
    .min(1, "Informe a data do registro da incorporação."),
  masterRegistrationNumber: z.string().trim().min(2, "Informe a matrícula mãe do empreendimento."),
  postalCode: z.string().trim().min(9, "Informe o CEP."),
  address: z.string().trim().min(4, "Informe o endereço."),
  number: z.string().trim().min(1, "Informe o número."),
  complement: z.string().trim().optional(),
  neighborhood: z.string().trim().min(2, "Informe o bairro."),
  city: z.string().trim().min(2, "Informe a cidade."),
  state: brazilStateSchema,
  registryOfficeName: z.string().trim().min(2, "Informe o nome do cartório."),
  registryOfficeNumber: z.string().trim().min(1, "Informe o número do cartório."),
  registryOfficeCity: z.string().trim().min(2, "Informe a cidade do cartório."),
  registryOfficeState: brazilStateSchema,
  totalUnits: z.coerce.number().int().min(1, "Informe a quantidade total de unidades."),
  totalTowers: z.coerce.number().int().min(1, "Informe a quantidade de torres ou blocos."),
  parkingSpots: z.coerce.number().int().min(0, "Informe um número válido.").optional(),
  status: developmentRegistrationStatusSchema,
}).superRefine((value, ctx) => {
  if (!value.supplierId && !value.supplierCustomName) {
    ctx.addIssue({
      code: "custom",
      path: ["supplierId"],
      message: "Selecione a incorporadora responsável ou informe um novo nome.",
    });
  }

  if (value.supplierCustomName && value.supplierCustomName.length < 2) {
    ctx.addIssue({
      code: "custom",
      path: ["supplierCustomName"],
      message: "Informe um nome válido para a incorporadora responsável.",
    });
  }
});

export type DevelopmentRegistrationFormInput = z.input<typeof developmentRegistrationFormSchema>;
export type DevelopmentRegistrationFormValues = z.output<typeof developmentRegistrationFormSchema>;
