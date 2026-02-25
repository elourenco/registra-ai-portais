import {
  formatCnpj,
  type SupplierCompanyProfile,
  type SupplierOnboardingInput,
  supplierOnboardingSchema,
  type SupplierSignupInput,
  supplierSignupSchema,
} from "@registra/shared";
import { z } from "zod";

import { apiRequest } from "@/shared/api/http-client";
import { portalConfig } from "@/shared/config/portal-config";

export interface LookupSupplierByCnpjResponse {
  company: SupplierCompanyProfile;
  alreadyRegistered: boolean;
}

export interface SignupSupplierResponse {
  supplierId: string;
}

const authResponseSchema = z.object({
  accessToken: z.string().min(1),
});

const supplierCompanySchema = z.object({
  id: z.string().min(1),
});

const supplierLookupResponseSchema = z
  .object({
    cnpj: z.string(),
    isValid: z.boolean(),
    isRegistered: z.boolean(),
    canProceed: z.boolean(),
    message: z.string(),
    prefill: z
      .object({
        legalName: z.string().nullable().optional(),
        cnpj: z.string(),
        legalRepresentativeName: z.string().nullable().optional(),
        contactEmail: z.string().nullable().optional(),
        contactPhone: z.string().nullable().optional(),
        address: z
          .object({
            zipCode: z.string().nullable().optional(),
            street: z.string().nullable().optional(),
            number: z.string().nullable().optional(),
            complement: z.string().nullable().optional(),
            district: z.string().nullable().optional(),
            city: z.string().nullable().optional(),
            state: z.string().nullable().optional(),
          })
          .nullable()
          .optional(),
      })
      .nullable()
      .optional(),
    company: z
      .object({
        legalName: z.string().optional(),
        cnpj: z.string(),
        legalRepresentativeName: z.string().optional(),
        contactEmail: z.string().optional(),
        contactPhone: z.string().optional(),
        address: z
          .object({
            zipCode: z.string().optional(),
            street: z.string().optional(),
            number: z.string().optional(),
            complement: z.string().nullable().optional(),
            district: z.string().optional(),
            city: z.string().optional(),
            state: z.string().optional(),
          })
          .optional(),
      })
      .nullable()
      .optional(),
  })
  .passthrough();

function pickText(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return "";
}

function mapLookupToCompanyProfile(
  cnpj: string,
  lookup: z.infer<typeof supplierLookupResponseSchema>,
): SupplierCompanyProfile {
  return {
    cnpj: formatCnpj(lookup.cnpj || cnpj),
    legalName: pickText(lookup.prefill?.legalName, lookup.company?.legalName),
    tradeName: pickText(lookup.prefill?.legalName, lookup.company?.legalName),
    legalRepresentativeName: pickText(
      lookup.prefill?.legalRepresentativeName,
      lookup.company?.legalRepresentativeName,
    ),
    contactPhone: pickText(lookup.prefill?.contactPhone, lookup.company?.contactPhone),
    email: pickText(lookup.prefill?.contactEmail, lookup.company?.contactEmail),
    zipCode: pickText(lookup.prefill?.address?.zipCode, lookup.company?.address?.zipCode),
    street: pickText(lookup.prefill?.address?.street, lookup.company?.address?.street),
    number: pickText(lookup.prefill?.address?.number, lookup.company?.address?.number),
    complement: pickText(lookup.prefill?.address?.complement, lookup.company?.address?.complement),
    district: pickText(lookup.prefill?.address?.district, lookup.company?.address?.district),
    city: pickText(lookup.prefill?.address?.city, lookup.company?.address?.city),
    state: pickText(lookup.prefill?.address?.state, lookup.company?.address?.state).toUpperCase(),
  };
}

export async function lookupSupplierByCnpj(
  payload: SupplierOnboardingInput,
): Promise<LookupSupplierByCnpjResponse> {
  const parsedPayload = supplierOnboardingSchema.parse(payload);

  const lookupResponse = await apiRequest<unknown>("/api/v1/utils/supplier/cnpj/lookup", {
    method: "POST",
    body: JSON.stringify({
      cnpj: parsedPayload.cnpj,
      portal: portalConfig.role,
    }),
  });

  const parsedLookup = supplierLookupResponseSchema.parse(lookupResponse);

  if (!parsedLookup.canProceed) {
    throw new Error(parsedLookup.message || "Nao foi possivel processar este CNPJ.");
  }

  return {
    company: mapLookupToCompanyProfile(parsedPayload.cnpj, parsedLookup),
    alreadyRegistered: parsedLookup.isRegistered,
  };
}

export async function signupSupplier(payload: SupplierSignupInput): Promise<SignupSupplierResponse> {
  const parsedPayload = supplierSignupSchema.parse(payload);

  const signUpResponse = await apiRequest<unknown>("/api/v1/auth/sign-up", {
    method: "POST",
    body: JSON.stringify({
      name: parsedPayload.legalRepresentativeName,
      email: parsedPayload.email,
      password: parsedPayload.password,
      portal: portalConfig.role,
    }),
  });

  const parsedSignUpResponse = authResponseSchema.parse(signUpResponse);

  const supplierCompany = await apiRequest<unknown>("/api/v1/supplier/onboarding/company", {
    method: "PUT",
    token: parsedSignUpResponse.accessToken,
    body: JSON.stringify({
      legalName: parsedPayload.legalName,
      cnpj: parsedPayload.cnpj,
      legalRepresentativeName: parsedPayload.legalRepresentativeName,
      contactEmail: parsedPayload.email,
      contactPhone: parsedPayload.contactPhone,
      address: {
        zipCode: parsedPayload.zipCode,
        street: parsedPayload.street,
        number: parsedPayload.number,
        complement: parsedPayload.complement?.trim() ? parsedPayload.complement : null,
        district: parsedPayload.district,
        city: parsedPayload.city,
        state: parsedPayload.state,
      },
      portal: portalConfig.role,
    }),
  });

  const parsedSupplierCompany = supplierCompanySchema.parse(supplierCompany);

  return {
    supplierId: parsedSupplierCompany.id,
  };
}
