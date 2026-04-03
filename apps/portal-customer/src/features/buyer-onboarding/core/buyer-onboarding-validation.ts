import type { OnboardingState } from "../buyer-onboarding.types";
import { z } from "zod";

export const loginStepSchema = z
  .object({
    identifierType: z.enum(["cpf", "cnpj"]),
    documentNumber: z.string().trim().min(14, "Informe um documento válido."),
    accessCode: z.string().trim().min(4, "Informe o código de acesso."),
  })
  .superRefine((value, ctx) => {
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
  });

export const propertyStepSchema = z.object({
  name: z.string().trim().min(1),
  cnpj: z.string().trim().min(1),
  address: z.string().trim().min(1),
  unitLabel: z.string().trim().min(1),
  acquisitionType: z.string().trim().min(1),
  purchaseValue: z.string().trim().min(1),
});

function isAtLeast16YearsOld(value: string): boolean {
  const birthDate = new Date(`${value}T00:00:00`);

  if (Number.isNaN(birthDate.getTime())) {
    return false;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasNotHadBirthdayYet =
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate());

  if (hasNotHadBirthdayYet) {
    age -= 1;
  }

  return age >= 16;
}

export function createPersonalSchema(isCompanyFlow: boolean) {
  return z.object({
    fullName: z.string().trim().min(3, "Informe seu nome completo."),
    cpf: z.string().trim().min(11, isCompanyFlow ? "CNPJ inválido." : "CPF inválido."),
    birthDate: z
      .string()
      .trim()
      .min(1, isCompanyFlow ? "Informe a data de constituição." : "Informe a data de nascimento.")
      .refine(
        (value) => (isCompanyFlow ? true : isAtLeast16YearsOld(value)),
        "O comprador deve ter pelo menos 16 anos.",
      ),
    nationality: z.string().trim().min(2, "Informe a nacionalidade."),
    profession: z.string().trim().min(2, "Informe a profissão."),
    email: z.string().trim().email("Informe um e-mail válido."),
    phone: z.string().trim().min(10, "Informe um telefone válido."),
  });
}

export const spouseSchema = z.object({
  fullName: z.string().trim().min(3, "Informe o nome completo do cônjuge."),
  cpf: z.string().trim().min(11, "Informe um CPF válido."),
  birthDate: z.string().trim().min(1, "Informe a data de nascimento."),
  email: z.string().trim().email("Informe um e-mail válido."),
  phone: z.string().trim().min(10, "Informe um telefone válido."),
});

function isCompanyFlow(state: OnboardingState) {
  return state.access.identifierType === "cnpj";
}

export function isLoginStepComplete(state: OnboardingState) {
  return loginStepSchema.safeParse(state.access).success;
}

export function isPropertyStepComplete(state: OnboardingState) {
  return state.isPropertyConfirmed && propertyStepSchema.safeParse(state.property).success;
}

export function isPersonalStepComplete(state: OnboardingState) {
  return createPersonalSchema(isCompanyFlow(state)).safeParse(state.personalData).success;
}

export function isMaritalStepComplete(state: OnboardingState) {
  return (
    isCompanyFlow(state) ||
    z.enum(["single", "married", "stable_union"]).safeParse(state.maritalStatus).success
  );
}

export function isSpouseStepRequired(state: OnboardingState) {
  return !isCompanyFlow(state) && state.hasSpouse;
}

export function isSpouseStepComplete(state: OnboardingState) {
  return !isSpouseStepRequired(state) || spouseSchema.safeParse(state.spouseData).success;
}

export function isDocumentsStepComplete(state: OnboardingState) {
  return (
    state.documents.length > 0 &&
    state.documents.every((document) => document.status === "uploaded" || document.status === "approved")
  );
}

export function isReviewStepComplete(state: OnboardingState) {
  return (
    isPropertyStepComplete(state) &&
    isPersonalStepComplete(state) &&
    isMaritalStepComplete(state) &&
    isDocumentsStepComplete(state) &&
    state.eNotariadoConfirmed
  );
}

export function resolveOnboardingStep(
  state: OnboardingState,
  includeLoginStep: boolean,
): OnboardingState["step"] {
  if (includeLoginStep && !isLoginStepComplete(state)) {
    return "login";
  }

  if (!state.basicDataConfirmed && !state.isPropertyConfirmed) {
    return "property";
  }

  if (state.trackerStatus === "in_review" || state.trackerStatus === "completed") {
    return "tracker";
  }

  if (!isPropertyStepComplete(state)) {
    return "property";
  }

  if (!isPersonalStepComplete(state)) {
    return "personal";
  }

  if (!isMaritalStepComplete(state)) {
    return "marital";
  }

  if (!isDocumentsStepComplete(state)) {
    return "documents";
  }

  if (!state.submittedAt) {
    return "review";
  }

  return state.trackerStatus === "waiting_user" ? "documents" : "tracker";
}
