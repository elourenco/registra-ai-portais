import {
  supplierDevelopmentContextSchema,
  supplierDevelopmentDetailSchema,
  supplierDevelopmentListItemSchema,
  supplierDevelopmentListResultSchema,
  supplierDevelopmentProcessSummarySchema,
  supplierDevelopmentBuyerSummarySchema,
  supplierDetailSchema,
  supplierListItemSchema,
  supplierProcessesListResultSchema,
  suppliersPaginationSchema,
  type SupplierDevelopmentContext,
  type SupplierDevelopmentDetail,
  type SupplierDevelopmentListItem,
  type SupplierDevelopmentProcessSummary,
  type SupplierDevelopmentBuyerSummary,
  type SupplierDetail,
  type SupplierListItem,
  type SupplierProcessListItem,
  type SupplierProcessesListResult,
  type SuppliersPagination,
  type SupplierStatus,
} from "@registra/shared";
import { z } from "zod";

import { isRecord, pickBoolean, pickNumber, pickText } from "@/shared/utils/api-normalizers";

export function toSupplierStatus(value: unknown): SupplierStatus {
  if (typeof value !== "string") {
    return "active";
  }

  switch (value.trim().toLowerCase()) {
    case "active":
      return "active";
    case "draft":
    case "pending":
    case "pending_onboarding":
    case "pending-onboarding":
    case "inactive":
    case "suspended":
    case "blocked":
      return "draft";
    default:
      return "active";
  }
}

export function toSupplierProcessStatus(value: unknown): SupplierProcessListItem["status"] {
  if (typeof value !== "string") {
    return "in_progress";
  }

  switch (value.trim().toLowerCase()) {
    case "new":
    case "created":
    case "pending":
    case "in_progress":
    case "in-progress":
    case "processing":
      return "in_progress";
    case "completed":
    case "done":
      return "completed";
    case "blocked":
    case "cancelled":
    case "canceled":
      return "cancelled";
    default:
      return "in_progress";
  }
}

export function toSupplierDevelopmentStatus(
  value: unknown,
): SupplierDevelopmentListItem["status"] {
  if (typeof value !== "string") {
    return "drafting";
  }

  switch (value.trim().toLowerCase()) {
    case "drafting":
      return "drafting";
    case "commercialization":
      return "commercialization";
    case "registry":
      return "registry";
    case "completed":
      return "completed";
    default:
      return "drafting";
  }
}

export function toSupplierDevelopmentBuyerStatus(
  value: unknown,
): SupplierDevelopmentBuyerSummary["status"] {
  if (typeof value !== "string") {
    return "pending";
  }

  switch (value.trim().toLowerCase()) {
    case "pending":
      return "pending";
    case "active":
      return "active";
    case "completed":
      return "completed";
    case "inactive":
      return "inactive";
    default:
      return "pending";
  }
}

interface ResolveSuppliersListPathFilters {
  cnpj?: string;
  name?: string;
  status?: string;
}

export function resolveSuppliersListPath(
  page: number,
  limit: number,
  filters?: ResolveSuppliersListPathFilters,
): string {
  const endpoint =
    import.meta.env.VITE_BACKOFFICE_SUPPLIERS_ENDPOINT ?? "/api/v1/supplier/companies";
  const [path, queryString = ""] = endpoint.split("?");
  const searchParams = new URLSearchParams(queryString);

  searchParams.set("page", String(page));
  searchParams.set("limit", String(limit));

  if (filters?.name) {
    searchParams.set("name", filters.name);
  } else {
    searchParams.delete("name");
  }

  if (filters?.cnpj) {
    searchParams.set("cnpj", filters.cnpj);
  } else {
    searchParams.delete("cnpj");
  }

  if (filters?.status) {
    searchParams.set("status", filters.status);
  } else {
    searchParams.delete("status");
  }

  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

export function resolveSupplierDetailPath(supplierId: string): string {
  const endpoint =
    import.meta.env.VITE_BACKOFFICE_SUPPLIER_DETAIL_ENDPOINT ??
    "/api/v1/supplier/companies/{supplierCompanyId}";
  const encodedId = encodeURIComponent(supplierId);

  if (endpoint.includes("{supplierCompanyId}")) {
    return endpoint.replace("{supplierCompanyId}", encodedId);
  }

  if (endpoint.includes("{id}")) {
    return endpoint.replace("{id}", encodedId);
  }

  return `${endpoint.replace(/\/$/, "")}/${encodedId}`;
}

export function resolveSupplierProcessesPath(supplierId: string): string {
  const endpoint =
    import.meta.env.VITE_BACKOFFICE_SUPPLIER_PROCESSES_ENDPOINT ??
    "/api/v1/workflows/suppliers/{supplierCompanyId}/processes";
  const encodedId = encodeURIComponent(supplierId);

  if (endpoint.includes("{supplierCompanyId}")) {
    return endpoint.replace("{supplierCompanyId}", encodedId);
  }

  if (endpoint.includes("{id}")) {
    return endpoint.replace("{id}", encodedId);
  }

  return `${endpoint.replace(/\/$/, "")}/${encodedId}/processes`;
}

export function resolveSupplierDevelopmentsPath(
  page: number,
  limit: number,
  supplierId: string,
): string {
  const endpoint =
    import.meta.env.VITE_BACKOFFICE_DEVELOPMENTS_ENDPOINT ?? "/api/v1/developments";
  const [path, queryString = ""] = endpoint.split("?");
  const searchParams = new URLSearchParams(queryString);

  searchParams.set("page", String(page));
  searchParams.set("limit", String(limit));
  searchParams.set("supplierId", supplierId);

  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

export function resolveDevelopmentDetailPath(developmentId: string): string {
  const endpoint =
    import.meta.env.VITE_BACKOFFICE_DEVELOPMENT_DETAIL_ENDPOINT ??
    "/api/v1/developments/{developmentId}";
  const encodedId = encodeURIComponent(developmentId);

  if (endpoint.includes("{developmentId}")) {
    return endpoint.replace("{developmentId}", encodedId);
  }

  if (endpoint.includes("{id}")) {
    return endpoint.replace("{id}", encodedId);
  }

  return `${endpoint.replace(/\/$/, "")}/${encodedId}`;
}

export function pickSupplierItems(response: unknown, keys: string[]): unknown[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (!isRecord(response)) {
    return [];
  }

  for (const key of keys) {
    const value = response[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  if (isRecord(response.data)) {
    for (const key of keys) {
      const value = response.data[key];
      if (Array.isArray(value)) {
        return value;
      }
    }
  }

  return [];
}

export function pickSuppliersPagination(
  response: unknown,
  requestedPage: number,
  requestedLimit: number,
  currentItemsCount: number,
): SuppliersPagination {
  if (!isRecord(response)) {
    return suppliersPaginationSchema.parse({
      page: requestedPage,
      limit: requestedLimit,
      totalItems: currentItemsCount,
      totalPages: currentItemsCount > 0 ? requestedPage : 1,
      hasNextPage: false,
      hasPreviousPage: requestedPage > 1,
    });
  }

  const nestedPagination = isRecord(response.pagination)
    ? response.pagination
    : isRecord(response.meta)
      ? response.meta
      : null;

  const page = Math.max(
    1,
    pickNumber(
      requestedPage,
      response.page,
      response.currentPage,
      response.pageNumber,
      nestedPagination?.page,
      nestedPagination?.currentPage,
    ),
  );

  const limit = Math.max(
    1,
    pickNumber(
      requestedLimit,
      response.limit,
      response.pageSize,
      response.perPage,
      response.take,
      nestedPagination?.limit,
      nestedPagination?.pageSize,
      nestedPagination?.perPage,
    ),
  );

  const totalItems = Math.max(
    0,
    pickNumber(
      currentItemsCount,
      response.total,
      response.totalItems,
      response.totalCount,
      response.count,
      nestedPagination?.total,
      nestedPagination?.totalItems,
      nestedPagination?.totalCount,
      nestedPagination?.count,
    ),
  );

  const parsedTotalPages = pickNumber(0, response.totalPages, nestedPagination?.totalPages);
  const totalPages = Math.max(
    1,
    parsedTotalPages > 0 ? parsedTotalPages : Math.ceil(totalItems / limit) || 1,
  );

  const hasNextValue = pickBoolean(response.hasNextPage, nestedPagination?.hasNextPage);
  const hasPreviousValue = pickBoolean(response.hasPreviousPage, nestedPagination?.hasPreviousPage);

  return suppliersPaginationSchema.parse({
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: hasNextValue ?? page < totalPages,
    hasPreviousPage: hasPreviousValue ?? page > 1,
  });
}

export function pickSupplierDetailPayload(response: unknown): unknown {
  if (!isRecord(response)) {
    return response;
  }

  for (const key of ["data", "item", "supplier", "company", "detail"]) {
    if (isRecord(response[key])) {
      return response[key];
    }
  }

  return response;
}

export function pickDevelopmentContextPayload(response: unknown): unknown {
  if (!isRecord(response)) {
    return response;
  }

  if (
    isRecord(response.data) &&
    (isRecord(response.data.development) || Array.isArray(response.data.buyers))
  ) {
    return response.data;
  }

  return response;
}

export function toSupplierListItem(raw: unknown, index: number): SupplierListItem {
  const item = isRecord(raw) ? raw : {};
  const workflow = isRecord(item.workflow) ? item.workflow : null;

  return supplierListItemSchema.parse({
    id: pickText(item.id, item.companyId, item.supplierId) ?? `supplier-${index}`,
    legalName:
      pickText(item.legalName, item.tradeName, item.name, item.companyName, item.razaoSocial) ??
      "Empresa sem nome",
    cnpj: pickText(item.cnpj, item.document, item.cnpjNumber) ?? "-",
    email: pickText(item.contactEmail, item.email, item.ownerEmail) ?? "-",
    workflowId: pickText(item.workflowId, workflow?.id),
    workflowName: pickText(item.workflowName, workflow?.name),
    status: toSupplierStatus(item.status),
    createdAt: pickText(item.createdAt, item.created_at, item.updatedAt) ?? new Date().toISOString(),
  });
}

export function toSupplierDevelopmentListItem(
  raw: unknown,
  index: number,
): SupplierDevelopmentListItem {
  const item = isRecord(raw) ? raw : {};

  return supplierDevelopmentListItemSchema.parse({
    id: pickText(item.id) ?? `development-${index}`,
    supplierId: pickText(item.supplierId),
    name: pickText(item.name) ?? "Empreendimento",
    cnpj: pickText(item.cnpj, item.speCnpj) ?? "-",
    address: pickText(item.address) ?? "-",
    status: toSupplierDevelopmentStatus(item.status),
    buyersCount: Math.max(0, pickNumber(0, item.buyersCount)),
  });
}

export function toSupplierDetail(raw: unknown, supplierId: string): SupplierDetail {
  const item = isRecord(raw) ? raw : {};
  const workflow = isRecord(item.workflow) ? item.workflow : null;
  const address = isRecord(item.address) ? item.address : null;
  const internalUsersSource = Array.isArray(item.internalUsers)
    ? item.internalUsers
    : Array.isArray(item.users)
      ? item.users
      : Array.isArray(item.members)
        ? item.members
        : Array.isArray(item.teamMembers)
          ? item.teamMembers
          : [];

  return supplierDetailSchema.parse({
    id: pickText(item.id, item.companyId, item.supplierId) ?? supplierId,
    legalName:
      pickText(item.legalName, item.tradeName, item.name, item.companyName, item.razaoSocial) ??
      "Empresa sem nome",
    tradeName: pickText(item.tradeName, item.fantasyName),
    cnpj: pickText(item.cnpj, item.document, item.cnpjNumber) ?? "-",
    email: pickText(item.contactEmail, item.email, item.ownerEmail) ?? "-",
    workflowId: pickText(item.workflowId, workflow?.id),
    workflowName: pickText(item.workflowName, workflow?.name),
    status: toSupplierStatus(item.status),
    createdAt: pickText(item.createdAt, item.created_at) ?? new Date().toISOString(),
    legalRepresentativeName: pickText(item.legalRepresentativeName, item.responsibleName),
    contactName: pickText(
      item.contactName,
      item.contact,
      item.ownerName,
      item.responsibleName,
      item.legalRepresentativeName,
    ),
    phone: pickText(item.phone, item.phoneNumber, item.mobile, item.contactPhone),
    zipCode: pickText(item.zipCode, address?.zipCode, address?.postalCode, item.cep),
    street: pickText(item.street, item.addressLine1, address?.street),
    number: pickText(item.number, address?.number),
    complement: pickText(item.complement, address?.complement),
    district: pickText(item.district, item.neighborhood, address?.district, address?.neighborhood),
    notes: pickText(item.notes, item.observation, item.comments),
    city: pickText(item.city, address?.city),
    state: pickText(item.state, item.uf, address?.state, address?.uf),
    updatedAt: pickText(item.updatedAt, item.updated_at),
    internalUsers: internalUsersSource.map((user, index) => {
      const currentUser = isRecord(user) ? user : {};

      return {
        id: pickText(currentUser.id, currentUser.userId, currentUser.accountId) ?? `internal-user-${index}`,
        name: pickText(currentUser.name, currentUser.fullName) ?? "Usuario sem nome",
        email: pickText(currentUser.email, currentUser.contactEmail, currentUser.login) ?? "-",
        phone: pickText(currentUser.phone, currentUser.phoneNumber, currentUser.mobile),
        role: pickText(currentUser.role, currentUser.roleName, currentUser.position),
        status: pickText(currentUser.status),
        createdAt: pickText(currentUser.createdAt, currentUser.created_at),
      };
    }),
  });
}

export function toSupplierDevelopmentDetail(
  raw: unknown,
  developmentId: string,
): SupplierDevelopmentDetail {
  const item = isRecord(raw) ? raw : {};

  return supplierDevelopmentDetailSchema.parse({
    id: pickText(item.id) ?? developmentId,
    supplierId: pickText(item.supplierId),
    supplierCustomName: pickText(item.supplierCustomName),
    name: pickText(item.name) ?? "Empreendimento",
    cnpj: pickText(item.cnpj, item.speCnpj) ?? "-",
    legalName: pickText(item.legalName) ?? "Empreendimento",
    tradeName: pickText(item.tradeName),
    developmentType: pickText(item.developmentType) ?? "-",
    incorporationRegistrationNumber: pickText(item.incorporationRegistrationNumber) ?? "-",
    incorporationRegistrationDate: pickText(item.incorporationRegistrationDate) ?? "-",
    masterRegistrationNumber: pickText(item.masterRegistrationNumber) ?? "-",
    postalCode: pickText(item.postalCode) ?? "-",
    address: pickText(item.address) ?? "-",
    number: pickText(item.number) ?? "-",
    complement: pickText(item.complement),
    neighborhood: pickText(item.neighborhood) ?? "-",
    city: pickText(item.city) ?? "-",
    state: pickText(item.state) ?? "-",
    registryOfficeName: pickText(item.registryOfficeName) ?? "-",
    registryOfficeNumber: pickText(item.registryOfficeNumber) ?? "-",
    registryOfficeCity: pickText(item.registryOfficeCity) ?? "-",
    registryOfficeState: pickText(item.registryOfficeState) ?? "-",
    totalUnits: Math.max(1, pickNumber(1, item.totalUnits)),
    totalTowers: Math.max(1, pickNumber(1, item.totalTowers)),
    parkingSpots:
      item.parkingSpots == null ? null : Math.max(0, pickNumber(0, item.parkingSpots)),
    status: toSupplierDevelopmentStatus(item.status),
    createdAt: pickText(item.createdAt) ?? new Date().toISOString(),
    updatedAt: pickText(item.updatedAt, item.createdAt) ?? new Date().toISOString(),
  });
}

export function toSupplierDevelopmentBuyerSummary(
  raw: unknown,
  index: number,
): SupplierDevelopmentBuyerSummary {
  const item = isRecord(raw) ? raw : {};

  return supplierDevelopmentBuyerSummarySchema.parse({
    id: pickText(item.id) ?? `buyer-${index}`,
    name: pickText(item.name) ?? "Comprador",
    cpf: pickText(item.cpf) ?? "-",
    email: pickText(item.email) ?? "nao-informado@registra.ai",
    phone: pickText(item.phone) ?? "-",
    processId: pickText(item.processId),
    unitLabel: pickText(item.unitLabel),
    status: toSupplierDevelopmentBuyerStatus(item.status),
  });
}

export function toSupplierDevelopmentProcessSummary(
  raw: unknown,
  index: number,
): SupplierDevelopmentProcessSummary {
  const item = isRecord(raw) ? raw : {};

  return supplierDevelopmentProcessSummarySchema.parse({
    id: pickText(item.id) ?? `process-${index}`,
    name: pickText(item.name) ?? "Processo",
    status: toSupplierProcessStatus(item.status),
    stageName: pickText(
      item.stageName,
      item.currentStepName,
      item.currentStageName,
      item.stepName,
    ),
    createdAt: pickText(item.createdAt) ?? new Date().toISOString(),
  });
}

export function toSupplierDevelopmentListResult(
  response: unknown,
  requestedPage: number,
  requestedLimit: number,
): z.infer<typeof supplierDevelopmentListResultSchema> {
  const rawItems = pickSupplierItems(response, ["items", "data", "results", "developments"]);
  const items = rawItems.map(toSupplierDevelopmentListItem);
  const pagination = pickSuppliersPagination(response, requestedPage, requestedLimit, items.length);

  return supplierDevelopmentListResultSchema.parse({
    items,
    pagination,
  });
}

export function toSupplierDevelopmentContext(
  response: unknown,
  developmentId: string,
): SupplierDevelopmentContext {
  const payload = pickDevelopmentContextPayload(response);
  const item = isRecord(payload) ? payload : {};
  const developmentSource = isRecord(item.development) ? item.development : item;
  const buyers = Array.isArray(item.buyers) ? item.buyers : [];
  const processes = Array.isArray(item.processes) ? item.processes : [];

  return supplierDevelopmentContextSchema.parse({
    development: toSupplierDevelopmentDetail(developmentSource, developmentId),
    buyers: buyers.map(toSupplierDevelopmentBuyerSummary),
    processes: processes.map(toSupplierDevelopmentProcessSummary),
  });
}

export function toSupplierProcessListItem(raw: unknown, index: number): SupplierProcessListItem {
  const item = isRecord(raw) ? raw : {};
  const workflow = isRecord(item.workflow) ? item.workflow : null;
  const stages = Array.isArray(item.stages) ? item.stages : [];
  const currentStep =
    stages
      .map((stage) => (isRecord(stage) ? stage : null))
      .find((stage) => stage && pickText(stage.status) === "in_progress") ?? null;

  return supplierProcessesListResultSchema.shape.items.element.parse({
    id: pickText(item.id, item.processId, item.instanceId) ?? `process-${index}`,
    protocol:
      pickText(item.protocol, item.code, item.reference, item.processNumber) ??
      `PROC-${String(index + 1).padStart(4, "0")}`,
    title: pickText(item.title, item.name, item.processName, item.workflowTitle) ?? "Processo",
    developmentName: pickText(
      item.developmentName,
      item.projectName,
      isRecord(item.development) ? item.development.name : null,
    ),
    workflowName: pickText(item.workflowName, workflow?.name, item.flowName) ?? "Workflow",
    stageName: pickText(
      item.stageName,
      item.currentStepName,
      item.currentStageName,
      currentStep?.name,
      item.stepName,
    ),
    status: toSupplierProcessStatus(item.status),
    createdAt:
      pickText(item.createdAt, item.created_at, item.startedAt) ?? new Date().toISOString(),
    updatedAt: pickText(item.updatedAt, item.updated_at, item.finishedAt, item.completedAt),
  });
}
