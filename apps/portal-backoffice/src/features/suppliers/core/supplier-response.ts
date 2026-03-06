import {
  supplierDetailSchema,
  supplierListItemSchema,
  supplierProcessesListResultSchema,
  suppliersPaginationSchema,
  type SupplierDetail,
  type SupplierListItem,
  type SupplierProcessListItem,
  type SupplierProcessesListResult,
  type SuppliersPagination,
  type SupplierStatus,
} from "@registra/shared";

import { isRecord, pickBoolean, pickNumber, pickText } from "@/shared/utils/api-normalizers";

export function toSupplierStatus(value: unknown): SupplierStatus {
  if (typeof value !== "string") {
    return "active";
  }

  switch (value.trim().toLowerCase()) {
    case "active":
      return "active";
    case "pending":
    case "pending_onboarding":
    case "pending-onboarding":
      return "pending_onboarding";
    case "suspended":
    case "inactive":
      return "suspended";
    case "draft":
      return "draft";
    default:
      return "active";
  }
}

export function toSupplierProcessStatus(value: unknown): SupplierProcessListItem["status"] {
  if (typeof value !== "string") {
    return "created";
  }

  switch (value.trim().toLowerCase()) {
    case "created":
    case "new":
      return "created";
    case "in_progress":
    case "in-progress":
    case "processing":
      return "in_progress";
    case "completed":
    case "done":
      return "completed";
    case "blocked":
      return "blocked";
    case "cancelled":
    case "canceled":
      return "cancelled";
    default:
      return "created";
  }
}

export function resolveSuppliersListPath(page: number, limit: number): string {
  const endpoint =
    import.meta.env.VITE_BACKOFFICE_SUPPLIERS_ENDPOINT ?? "/api/v1/supplier/companies";
  const [path, queryString = ""] = endpoint.split("?");
  const searchParams = new URLSearchParams(queryString);

  searchParams.set("page", String(page));
  searchParams.set("limit", String(limit));

  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

export function resolveSupplierDetailPath(supplierId: string): string {
  const endpoint =
    import.meta.env.VITE_BACKOFFICE_SUPPLIER_DETAIL_ENDPOINT ?? "/api/v1/supplier/companies/{id}";
  const encodedId = encodeURIComponent(supplierId);

  if (endpoint.includes("{id}")) {
    return endpoint.replace("{id}", encodedId);
  }

  return `${endpoint.replace(/\/$/, "")}/${encodedId}`;
}

export function resolveSupplierProcessesPath(
  supplierId: string,
  page: number,
  limit: number,
): string {
  const endpoint =
    import.meta.env.VITE_BACKOFFICE_SUPPLIER_PROCESSES_ENDPOINT ??
    "/api/v1/supplier/companies/{id}/processes";
  const encodedId = encodeURIComponent(supplierId);
  const resolvedEndpoint = endpoint.includes("{id}")
    ? endpoint.replace("{id}", encodedId)
    : `${endpoint.replace(/\/$/, "")}/${encodedId}/processes`;
  const [path, queryString = ""] = resolvedEndpoint.split("?");
  const searchParams = new URLSearchParams(queryString);

  searchParams.set("page", String(page));
  searchParams.set("limit", String(limit));

  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
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
    workflowId: pickText(item.workflowId),
    workflowName: pickText(item.workflowName, workflow?.name),
    status: toSupplierStatus(item.status),
    createdAt: pickText(item.createdAt, item.created_at) ?? new Date().toISOString(),
  });
}

export function toSupplierDetail(raw: unknown, supplierId: string): SupplierDetail {
  const item = isRecord(raw) ? raw : {};
  const workflow = isRecord(item.workflow) ? item.workflow : null;
  const address = isRecord(item.address) ? item.address : null;

  return supplierDetailSchema.parse({
    id: pickText(item.id, item.companyId, item.supplierId) ?? supplierId,
    legalName:
      pickText(item.legalName, item.tradeName, item.name, item.companyName, item.razaoSocial) ??
      "Empresa sem nome",
    tradeName: pickText(item.tradeName, item.fantasyName),
    cnpj: pickText(item.cnpj, item.document, item.cnpjNumber) ?? "-",
    email: pickText(item.contactEmail, item.email, item.ownerEmail) ?? "-",
    workflowId: pickText(item.workflowId),
    workflowName: pickText(item.workflowName, workflow?.name),
    status: toSupplierStatus(item.status),
    createdAt: pickText(item.createdAt, item.created_at) ?? new Date().toISOString(),
    contactName: pickText(item.contactName, item.ownerName, item.responsibleName),
    phone: pickText(item.phone, item.phoneNumber, item.mobile),
    notes: pickText(item.notes, item.observation, item.comments),
    city: pickText(item.city, address?.city),
    state: pickText(item.state, item.uf, address?.state, address?.uf),
    updatedAt: pickText(item.updatedAt, item.updated_at),
  });
}

export function toSupplierProcessListItem(raw: unknown, index: number): SupplierProcessListItem {
  const item = isRecord(raw) ? raw : {};
  const workflow = isRecord(item.workflow) ? item.workflow : null;
  const currentStep = isRecord(item.currentStep) ? item.currentStep : null;

  return supplierProcessesListResultSchema.shape.items.element.parse({
    id: pickText(item.id, item.processId, item.instanceId) ?? `process-${index}`,
    protocol:
      pickText(item.protocol, item.code, item.reference, item.processNumber) ??
      `PROC-${String(index + 1).padStart(4, "0")}`,
    title: pickText(item.title, item.name, item.processName, item.workflowTitle) ?? "Processo",
    workflowName: pickText(item.workflowName, workflow?.name, item.flowName) ?? "Workflow",
    currentStepName: pickText(item.currentStepName, currentStep?.name, item.stepName),
    status: toSupplierProcessStatus(item.status),
    createdAt:
      pickText(item.createdAt, item.created_at, item.startedAt) ?? new Date().toISOString(),
    updatedAt: pickText(item.updatedAt, item.updated_at, item.finishedAt),
  });
}
