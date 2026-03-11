import type { DevelopmentRegistrationFormValues } from "@registra/shared";

import {
  resolveCreateDevelopmentPath,
  toCreatedDevelopment,
  type CreatedDevelopment,
} from "@/features/developments/core/development-response";
import { apiRequest } from "@/shared/api/http-client";

export interface CreateDevelopmentParams {
  input: DevelopmentRegistrationFormValues;
  token: string;
}

export async function createDevelopment({
  input,
  token,
}: CreateDevelopmentParams): Promise<CreatedDevelopment> {
  const supplierId =
    input.supplierId && input.supplierId !== "__custom_supplier__"
      ? Number(input.supplierId)
      : null;

  const response = await apiRequest<unknown>(resolveCreateDevelopmentPath(), {
    token,
    method: "POST",
    body: JSON.stringify({
      supplierId: supplierId && Number.isFinite(supplierId) ? supplierId : null,
      supplierCustomName:
        input.supplierId === "__custom_supplier__" ? input.supplierCustomName ?? null : null,
      name: input.name,
      developmentType: input.developmentType,
      speCnpj: input.speCnpj.replace(/\D/g, ""),
      legalName: input.legalName,
      tradeName: input.tradeName || null,
      incorporationRegistrationNumber: input.incorporationRegistrationNumber,
      incorporationRegistrationDate: input.incorporationRegistrationDate,
      masterRegistrationNumber: input.masterRegistrationNumber,
      postalCode: input.postalCode,
      address: input.address,
      number: input.number,
      complement: input.complement || null,
      neighborhood: input.neighborhood,
      city: input.city,
      state: input.state,
      registryOfficeName: input.registryOfficeName,
      registryOfficeNumber: input.registryOfficeNumber,
      registryOfficeCity: input.registryOfficeCity,
      registryOfficeState: input.registryOfficeState,
      totalUnits: input.totalUnits,
      totalTowers: input.totalTowers,
      parkingSpots: input.parkingSpots ?? null,
      status: input.status,
    }),
  });

  return toCreatedDevelopment(response);
}
