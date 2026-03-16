import {
  parseCurrencyInput,
  type DevelopmentRegistrationFormInput,
  type DevelopmentRegistrationFormValues,
} from "@registra/shared";

import {
  toDevelopmentFormValues,
  buyerRegistrationFormSchema,
  toDevelopmentDetailResult,
  toDevelopmentListResult,
  type BuyerRegistrationFormValues,
  type DevelopmentDetail,
  type DevelopmentDetailResult,
  type DevelopmentListResult,
} from "@/features/developments/core/developments-schema";
import {
  toCreateDevelopmentRequestDraft,
  type SupplierDevelopmentCreateFormValues,
} from "@/features/developments/core/development-create-schema";
import { apiRequest } from "@/shared/api/http-client";

export interface ListDevelopmentsInput {
  token: string;
  supplierId?: string | null;
  page?: number;
  limit?: number;
  search?: string;
}

export interface GetDevelopmentDetailInput {
  token: string;
  developmentId: string;
}

export interface CreateDevelopmentInput {
  token: string;
  supplierId?: string | null;
  values: SupplierDevelopmentCreateFormValues;
}

export interface CreateBuyerInput {
  token: string;
  supplierId?: string | null;
  developmentId: string;
  values: BuyerRegistrationFormValues;
}

export interface UpdateDevelopmentInput {
  token: string;
  developmentId: string;
  supplierId?: string | null;
  values: DevelopmentRegistrationFormValues;
}

export interface DeleteDevelopmentInput {
  token: string;
  developmentId: string;
}

function resolveUpdateDevelopmentPath(developmentId: string): string {
  const endpoint =
    import.meta.env.VITE_SUPPLIER_DEVELOPMENT_UPDATE_ENDPOINT ??
    "/api/v1/developments/{developmentId}";

  return endpoint.replace("{developmentId}", encodeURIComponent(developmentId));
}

function resolveDeleteDevelopmentPath(developmentId: string): string {
  const endpoint =
    import.meta.env.VITE_SUPPLIER_DEVELOPMENT_DELETE_ENDPOINT ??
    "/api/v1/developments/{developmentId}";

  return endpoint.replace("{developmentId}", encodeURIComponent(developmentId));
}

export function getDevelopmentApiCapabilities() {
  return {
    canUpdateDevelopment: import.meta.env.VITE_SUPPLIER_DEVELOPMENT_MUTATIONS_ENABLED !== "false",
    canDeleteDevelopment: import.meta.env.VITE_SUPPLIER_DEVELOPMENT_MUTATIONS_ENABLED !== "false",
    canPersistBuyerPurchaseData:
      import.meta.env.VITE_SUPPLIER_BUYER_PURCHASE_DATA_ENABLED !== "false",
    canPersistBuyerAvailability:
      import.meta.env.VITE_SUPPLIER_BUYER_AVAILABILITY_ENABLED === "true",
  };
}

export async function listDevelopments({
  token,
  supplierId,
  page = 1,
  limit = 20,
  search,
}: ListDevelopmentsInput): Promise<DevelopmentListResult> {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(page));
  searchParams.set("limit", String(limit));

  if (supplierId) {
    searchParams.set("supplierId", supplierId);
  }

  if (search?.trim()) {
    searchParams.set("search", search.trim());
  }

  const response = await apiRequest<unknown>(`/api/v1/developments?${searchParams.toString()}`, {
    token,
    method: "GET",
  });

  return toDevelopmentListResult(response, page, limit);
}

export async function getDevelopmentDetail({
  token,
  developmentId,
}: GetDevelopmentDetailInput): Promise<DevelopmentDetailResult> {
  const response = await apiRequest<unknown>(`/api/v1/developments/${encodeURIComponent(developmentId)}`, {
    token,
    method: "GET",
  });

  return toDevelopmentDetailResult(response);
}

export async function createDevelopment({
  token,
  supplierId,
  values,
}: CreateDevelopmentInput) {
  const draft = toCreateDevelopmentRequestDraft(values, supplierId);
  const response = await apiRequest<unknown>("/api/v1/developments", {
    token,
    method: "POST",
    body: JSON.stringify({
      supplierId: draft.supplierId ? Number(draft.supplierId) : null,
      name: draft.name,
      developmentType: draft.developmentType,
      developmentModality: draft.developmentModality,
      speCnpj: draft.speCnpj.replace(/\D/g, ""),
      legalName: draft.legalName,
      tradeName: draft.tradeName.trim(),
      postalCode: draft.postalCode,
      address: draft.address,
      number: draft.number,
      complement: draft.complement?.trim() || null,
      neighborhood: draft.neighborhood,
      city: draft.city,
      state: draft.state,
      totalUnits: draft.totalUnits,
      totalTowers: draft.totalTowers,
      unitsPerFloor: draft.unitsPerFloor,
      totalFloors: draft.totalFloors,
      totalBlocks: draft.totalBlocks,
      totalLots: draft.totalLots,
      largerAreaContributorNote: draft.largerAreaContributorNote?.trim() || null,
      status: draft.status,
    }),
  });

  return toDevelopmentDetailResult({ development: response, supplier: null, buyers: [], processes: [] }).development;
}

export async function updateDevelopment({
  token,
  developmentId,
  supplierId,
  values,
}: UpdateDevelopmentInput): Promise<DevelopmentDetail> {
  const response = await apiRequest<unknown>(resolveUpdateDevelopmentPath(developmentId), {
    token,
    method: "PUT",
    body: JSON.stringify({
      supplierId: supplierId ? Number(supplierId) : null,
      supplierCustomName: values.supplierCustomName?.trim() || null,
      name: values.name,
      developmentType: values.developmentType,
      speCnpj: values.speCnpj.replace(/\D/g, ""),
      legalName: values.legalName,
      tradeName: values.tradeName?.trim() || null,
      incorporationRegistrationNumber: values.incorporationRegistrationNumber,
      incorporationRegistrationDate: values.incorporationRegistrationDate,
      masterRegistrationNumber: values.masterRegistrationNumber,
      postalCode: values.postalCode,
      address: values.address,
      number: values.number,
      complement: values.complement?.trim() || null,
      neighborhood: values.neighborhood,
      city: values.city,
      state: values.state,
      registryOfficeName: values.registryOfficeName,
      registryOfficeNumber: values.registryOfficeNumber,
      registryOfficeCity: values.registryOfficeCity,
      registryOfficeState: values.registryOfficeState,
      totalUnits: values.totalUnits,
      totalTowers: values.totalTowers,
      parkingSpots: values.parkingSpots ?? null,
      status: values.status,
    }),
  });

  return toDevelopmentDetailResult({
    development: response,
    supplier: null,
    buyers: [],
    processes: [],
  }).development;
}

export async function deleteDevelopment({
  token,
  developmentId,
}: DeleteDevelopmentInput): Promise<void> {
  await apiRequest<unknown>(resolveDeleteDevelopmentPath(developmentId), {
    token,
    method: "DELETE",
  });
}

export function buildUpdatePayloadFromDetail(
  development: DevelopmentDetail,
): DevelopmentRegistrationFormInput {
  return toDevelopmentFormValues(development);
}

export async function createBuyer({
  token,
  supplierId,
  developmentId,
  values,
}: CreateBuyerInput) {
  const parsedValues = buyerRegistrationFormSchema.parse(values);
  const capabilities = getDevelopmentApiCapabilities();

  return apiRequest<unknown>("/api/v1/buyers", {
    token,
    method: "POST",
    body: JSON.stringify({
      supplierId: supplierId ? Number(supplierId) : null,
      developmentId: Number(developmentId),
      name: parsedValues.name,
      cpf: parsedValues.cpf.replace(/\D/g, ""),
      email: parsedValues.email,
      phone: parsedValues.phone.replace(/\D/g, ""),
      maritalStatus: parsedValues.maritalStatus,
      nationality: parsedValues.nationality,
      profession: parsedValues.profession,
      unitLabel: parsedValues.unitLabel,
      acquisitionType:
        parsedValues.acquisitionType === "financing"
          ? "financed"
          : parsedValues.acquisitionType,
      purchaseValue: parseCurrencyInput(parsedValues.purchaseValue),
      contractDate: parsedValues.contractDate,
      notes: parsedValues.notes?.trim() || null,
      status: "pending",
      ...(capabilities.canPersistBuyerAvailability && parsedValues.availabilityItemId
        ? {
            availabilityItemId: Number(parsedValues.availabilityItemId),
          }
        : {}),
    }),
  });
}
