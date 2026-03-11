import { z } from "zod";

export const userRegistrationTypeSchema = z.enum(["cpf", "cnpj"]);
export type UserRegistrationType = z.infer<typeof userRegistrationTypeSchema>;

export const maritalStatusSchema = z.enum([
  "single",
  "married",
  "stable_union",
  "divorced",
  "widowed",
]);
export type MaritalStatus = z.infer<typeof maritalStatusSchema>;

export const maritalPropertyRegimeSchema = z.enum([
  "partial_community",
  "universal_community",
  "total_separation",
  "final_partition",
  "other",
]);
export type MaritalPropertyRegime = z.infer<typeof maritalPropertyRegimeSchema>;

export const userRegistrationDocumentStatusSchema = z.enum(["pending", "sent", "validated", "rejected"]);
export type UserRegistrationDocumentStatus = z.infer<typeof userRegistrationDocumentStatusSchema>;

export const userRegistrationDocumentTypeSchema = z.enum([
  "rg",
  "cnh",
  "proof_of_address",
  "birth_certificate",
  "marriage_certificate",
  "divorce_certificate",
  "spouse_rg",
  "spouse_cnh",
  "antenuptial_agreement",
  "cnpj_card",
  "articles_of_association",
  "legal_representative_identity",
  "company_proof_of_address",
]);
export type UserRegistrationDocumentType = z.infer<typeof userRegistrationDocumentTypeSchema>;

export const maritalStatusLabels: Record<MaritalStatus, string> = {
  single: "Solteiro",
  married: "Casado",
  stable_union: "União estável",
  divorced: "Divorciado",
  widowed: "Viúvo",
};

export const maritalPropertyRegimeLabels: Record<MaritalPropertyRegime, string> = {
  partial_community: "Comunhão parcial de bens",
  universal_community: "Comunhão universal de bens",
  total_separation: "Separação total de bens",
  final_partition: "Participação final nos aquestos",
  other: "Outro",
};

export const userRegistrationDocumentTypeLabels: Record<UserRegistrationDocumentType, string> = {
  rg: "RG",
  cnh: "CNH",
  proof_of_address: "Comprovante de endereço",
  birth_certificate: "Certidão de nascimento",
  marriage_certificate: "Certidão de casamento",
  divorce_certificate: "Certidão com averbação do divórcio",
  spouse_rg: "RG do cônjuge",
  spouse_cnh: "CNH do cônjuge",
  antenuptial_agreement: "Escritura de pacto antenupcial e registro",
  cnpj_card: "Cartão CNPJ",
  articles_of_association: "Contrato social",
  legal_representative_identity: "Documento do responsável",
  company_proof_of_address: "Comprovante de endereço da empresa",
};

export function normalizeDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatCpfInput(value: string): string {
  const digits = normalizeDigits(value).slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export function formatCnpjInput(value: string): string {
  const digits = normalizeDigits(value).slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function formatCepInput(value: string): string {
  const digits = normalizeDigits(value).slice(0, 8);
  return digits.replace(/^(\d{5})(\d)/, "$1-$2");
}

export function formatPhoneInput(value: string): string {
  const digits = normalizeDigits(value).slice(0, 11);

  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

export function formatCurrencyInput(value: string): string {
  const digits = normalizeDigits(value);
  const amount = Number(digits || "0") / 100;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function parseCurrencyInput(value: string): number {
  return Number(normalizeDigits(value) || "0") / 100;
}

export function isValidCpf(value: string): boolean {
  const digits = normalizeDigits(value);

  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) {
    return false;
  }

  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    sum += Number(digits[index]) * (10 - index);
  }

  let remainder = (sum * 10) % 11;
  if (remainder === 10) {
    remainder = 0;
  }

  if (remainder !== Number(digits[9])) {
    return false;
  }

  sum = 0;
  for (let index = 0; index < 10; index += 1) {
    sum += Number(digits[index]) * (11 - index);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10) {
    remainder = 0;
  }

  return remainder === Number(digits[10]);
}

export function isValidRegistrationCnpj(value: string): boolean {
  const digits = normalizeDigits(value);

  if (digits.length !== 14 || /^(\d)\1+$/.test(digits)) {
    return false;
  }

  const calculateDigit = (base: string, factors: number[]) => {
    const total = factors.reduce((sum, factor, index) => sum + Number(base[index]) * factor, 0);
    const remainder = total % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstDigit = calculateDigit(digits.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const secondDigit = calculateDigit(
    digits.slice(0, 12) + String(firstDigit),
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  );

  return digits.endsWith(`${firstDigit}${secondDigit}`);
}

export function requiresSpouseSection(maritalStatus: MaritalStatus | ""): boolean {
  return maritalStatus === "married" || maritalStatus === "stable_union";
}

export function getRequiredDocumentTypes(
  registrationType: UserRegistrationType,
  maritalStatus: MaritalStatus | "",
  maritalPropertyRegime?: MaritalPropertyRegime | "",
): UserRegistrationDocumentType[] {
  if (registrationType === "cpf") {
    const required: UserRegistrationDocumentType[] = ["proof_of_address"];

    if (maritalStatus === "single") {
      required.push("birth_certificate");
    }

    if (maritalStatus === "married" || maritalStatus === "stable_union" || maritalStatus === "widowed") {
      required.push("marriage_certificate");
    }

    if (maritalStatus === "divorced") {
      required.push("divorce_certificate");
    }

    if (requiresSpouseSection(maritalStatus)) {
      if (maritalPropertyRegime === "total_separation") {
        required.push("antenuptial_agreement");
      }
    }

    return required;
  }

  return [
    "cnpj_card",
    "articles_of_association",
    "legal_representative_identity",
    "company_proof_of_address",
  ];
}

export function getRequiredDocumentChecklist(
  registrationType: UserRegistrationType,
  maritalStatus: MaritalStatus | "",
  maritalPropertyRegime?: MaritalPropertyRegime | "",
): string[] {
  return getRequiredDocumentChecklistItems(
    registrationType,
    maritalStatus,
    maritalPropertyRegime,
  ).map((item) => item.label);
}

export interface RequiredDocumentChecklistItem {
  key: string;
  label: string;
  acceptedDocumentTypes: UserRegistrationDocumentType[];
}

export function getRequiredDocumentChecklistItems(
  registrationType: UserRegistrationType,
  maritalStatus: MaritalStatus | "",
  maritalPropertyRegime?: MaritalPropertyRegime | "",
): RequiredDocumentChecklistItem[] {
  if (registrationType === "cnpj") {
    return [
      {
        key: "cnpj-card",
        label: userRegistrationDocumentTypeLabels.cnpj_card,
        acceptedDocumentTypes: ["cnpj_card"],
      },
      {
        key: "articles-of-association",
        label: userRegistrationDocumentTypeLabels.articles_of_association,
        acceptedDocumentTypes: ["articles_of_association"],
      },
      {
        key: "legal-representative-identity",
        label: userRegistrationDocumentTypeLabels.legal_representative_identity,
        acceptedDocumentTypes: ["legal_representative_identity"],
      },
      {
        key: "company-proof-of-address",
        label: userRegistrationDocumentTypeLabels.company_proof_of_address,
        acceptedDocumentTypes: ["company_proof_of_address"],
      },
    ];
  }

  const checklist: RequiredDocumentChecklistItem[] = [
    {
      key: "buyer-identity",
      label: "RG ou CNH",
      acceptedDocumentTypes: ["rg", "cnh"],
    },
    {
      key: "proof-of-address",
      label: userRegistrationDocumentTypeLabels.proof_of_address,
      acceptedDocumentTypes: ["proof_of_address"],
    },
  ];

  if (maritalStatus === "single") {
    checklist.push({
      key: "birth-certificate",
      label: userRegistrationDocumentTypeLabels.birth_certificate,
      acceptedDocumentTypes: ["birth_certificate"],
    });
  }

  if (maritalStatus === "married" || maritalStatus === "stable_union" || maritalStatus === "widowed") {
    checklist.push({
      key: "marriage-certificate",
      label: userRegistrationDocumentTypeLabels.marriage_certificate,
      acceptedDocumentTypes: ["marriage_certificate"],
    });
  }

  if (maritalStatus === "divorced") {
    checklist.push({
      key: "divorce-certificate",
      label: userRegistrationDocumentTypeLabels.divorce_certificate,
      acceptedDocumentTypes: ["divorce_certificate"],
    });
  }

  if (requiresSpouseSection(maritalStatus)) {
    checklist.push({
      key: "spouse-identity",
      label: "RG ou CNH do cônjuge",
      acceptedDocumentTypes: ["spouse_rg", "spouse_cnh"],
    });

    if (maritalPropertyRegime === "total_separation") {
      checklist.push({
        key: "antenuptial-agreement",
        label: userRegistrationDocumentTypeLabels.antenuptial_agreement,
        acceptedDocumentTypes: ["antenuptial_agreement"],
      });
    }
  }

  return checklist;
}

export function getAvailableDocumentTypes(
  registrationType: UserRegistrationType,
): UserRegistrationDocumentType[] {
  if (registrationType === "cpf") {
    return [
      "rg",
      "cnh",
      "proof_of_address",
      "birth_certificate",
      "marriage_certificate",
      "divorce_certificate",
      "spouse_rg",
      "spouse_cnh",
      "antenuptial_agreement",
    ];
  }

  return [
    "cnpj_card",
    "articles_of_association",
    "legal_representative_identity",
    "company_proof_of_address",
  ];
}

export const uploadedRegistrationDocumentSchema = z.object({
  id: z.string().min(1),
  documentType: userRegistrationDocumentTypeSchema,
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  uploadedAt: z.string().datetime({ offset: true }),
  status: userRegistrationDocumentStatusSchema,
});
export type UploadedRegistrationDocument = z.infer<typeof uploadedRegistrationDocumentSchema>;

export const userRegistrationFormSchema = z
  .object({
    registrationType: userRegistrationTypeSchema,
    fullName: z.string().trim().optional(),
    cpf: z.string().trim().optional(),
    email: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    propertyValue: z.string().trim().optional(),
    birthDate: z.string().trim().optional(),
    maritalStatus: maritalStatusSchema.optional(),
    maritalPropertyRegime: maritalPropertyRegimeSchema.optional(),
    profession: z.string().trim().optional(),
    address: z.string().trim().optional(),
    cep: z.string().trim().optional(),
    city: z.string().trim().optional(),
    state: z.string().trim().optional(),
    spouseName: z.string().trim().optional(),
    spouseCpf: z.string().trim().optional(),
    spouseBirthDate: z.string().trim().optional(),
    spouseEmail: z.string().trim().optional(),
    spousePhone: z.string().trim().optional(),
    companyName: z.string().trim().optional(),
    tradeName: z.string().trim().optional(),
    cnpj: z.string().trim().optional(),
    corporateEmail: z.string().trim().optional(),
    responsibleName: z.string().trim().optional(),
    responsibleCpf: z.string().trim().optional(),
    stateRegistration: z.string().trim().optional(),
    companyAddress: z.string().trim().optional(),
    companyCep: z.string().trim().optional(),
    companyCity: z.string().trim().optional(),
    companyState: z.string().trim().optional(),
    documents: z.array(uploadedRegistrationDocumentSchema).default([]),
  })
  .superRefine((value, ctx) => {
    if (value.registrationType === "cpf") {
      if (!value.fullName) {
        ctx.addIssue({ code: "custom", path: ["fullName"], message: "Informe o nome completo." });
      }
      if (!value.cpf) {
        ctx.addIssue({ code: "custom", path: ["cpf"], message: "Informe o CPF." });
      } else if (!isValidCpf(value.cpf)) {
        ctx.addIssue({ code: "custom", path: ["cpf"], message: "Informe um CPF válido." });
      }
      if (!value.email) {
        ctx.addIssue({ code: "custom", path: ["email"], message: "Informe o e-mail." });
      } else if (!z.email().safeParse(value.email).success) {
        ctx.addIssue({ code: "custom", path: ["email"], message: "Informe um e-mail válido." });
      }
      if (!value.phone) {
        ctx.addIssue({ code: "custom", path: ["phone"], message: "Informe o telefone." });
      }
      if (!value.propertyValue || parseCurrencyInput(value.propertyValue) <= 0) {
        ctx.addIssue({ code: "custom", path: ["propertyValue"], message: "Informe o valor do imóvel." });
      }
      if (!value.birthDate) {
        ctx.addIssue({ code: "custom", path: ["birthDate"], message: "Informe a data de nascimento." });
      }
      if (!value.maritalStatus) {
        ctx.addIssue({ code: "custom", path: ["maritalStatus"], message: "Selecione o estado civil." });
      }
      if (requiresSpouseSection(value.maritalStatus ?? "") && !value.maritalPropertyRegime) {
        ctx.addIssue({
          code: "custom",
          path: ["maritalPropertyRegime"],
          message: "Selecione o regime de bens.",
        });
      }
      if (!value.profession) {
        ctx.addIssue({ code: "custom", path: ["profession"], message: "Informe a profissão." });
      }

      if (value.maritalStatus && requiresSpouseSection(value.maritalStatus)) {
        if (!value.spouseName) {
          ctx.addIssue({ code: "custom", path: ["spouseName"], message: "Informe o nome do cônjuge." });
        }
        if (!value.spouseCpf) {
          ctx.addIssue({ code: "custom", path: ["spouseCpf"], message: "Informe o CPF do cônjuge." });
        } else if (!isValidCpf(value.spouseCpf)) {
          ctx.addIssue({ code: "custom", path: ["spouseCpf"], message: "Informe um CPF válido para o cônjuge." });
        } else if (normalizeDigits(value.spouseCpf) === normalizeDigits(value.cpf ?? "")) {
          ctx.addIssue({ code: "custom", path: ["spouseCpf"], message: "O CPF do cônjuge deve ser diferente do titular." });
        }
        if (!value.spouseBirthDate) {
          ctx.addIssue({ code: "custom", path: ["spouseBirthDate"], message: "Informe a data de nascimento do cônjuge." });
        }
        if (value.spouseEmail && !z.email().safeParse(value.spouseEmail).success) {
          ctx.addIssue({ code: "custom", path: ["spouseEmail"], message: "Informe um e-mail válido para o cônjuge." });
        }
      }
    }

    if (value.registrationType === "cnpj") {
      if (!value.companyName) {
        ctx.addIssue({ code: "custom", path: ["companyName"], message: "Informe a razão social." });
      }
      if (!value.tradeName) {
        ctx.addIssue({ code: "custom", path: ["tradeName"], message: "Informe o nome fantasia." });
      }
      if (!value.cnpj) {
        ctx.addIssue({ code: "custom", path: ["cnpj"], message: "Informe o CNPJ." });
      } else if (!isValidRegistrationCnpj(value.cnpj)) {
        ctx.addIssue({ code: "custom", path: ["cnpj"], message: "Informe um CNPJ válido." });
      }
      if (!value.corporateEmail) {
        ctx.addIssue({ code: "custom", path: ["corporateEmail"], message: "Informe o e-mail corporativo." });
      } else if (!z.email().safeParse(value.corporateEmail).success) {
        ctx.addIssue({ code: "custom", path: ["corporateEmail"], message: "Informe um e-mail corporativo válido." });
      }
      if (!value.phone) {
        ctx.addIssue({ code: "custom", path: ["phone"], message: "Informe o telefone." });
      }
      if (!value.propertyValue || parseCurrencyInput(value.propertyValue) <= 0) {
        ctx.addIssue({ code: "custom", path: ["propertyValue"], message: "Informe o valor do imóvel." });
      }
      if (!value.responsibleName) {
        ctx.addIssue({ code: "custom", path: ["responsibleName"], message: "Informe o responsável legal." });
      }
      if (!value.responsibleCpf) {
        ctx.addIssue({ code: "custom", path: ["responsibleCpf"], message: "Informe o CPF do responsável legal." });
      } else if (!isValidCpf(value.responsibleCpf)) {
        ctx.addIssue({ code: "custom", path: ["responsibleCpf"], message: "Informe um CPF válido para o responsável legal." });
      }
    }

  });
export type UserRegistrationFormInput = z.input<typeof userRegistrationFormSchema>;
export type UserRegistrationFormValues = z.infer<typeof userRegistrationFormSchema>;
