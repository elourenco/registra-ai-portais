import {
  customerDetailSchema,
  customerListFiltersSchema,
  customerListItemSchema,
  customersListResultSchema,
  customersPaginationSchema,
  type CustomerDetail,
  type CustomerListFilters,
  type CustomerListItem,
  type CustomersListResult,
  type CustomersPagination,
  type CustomerStatus,
} from "@registra/shared";

import { apiRequest } from "@/shared/api/http-client";

const DEFAULT_CUSTOMERS_LIST_ENDPOINT = "/api/v1/customers";
const DEFAULT_CUSTOMER_DETAIL_ENDPOINT = "/api/v1/customers/{id}";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function pickText(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return null;
}

function pickNumber(fallback: number, ...values: unknown[]): number {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return Math.trunc(value);
    }

    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return Math.trunc(parsed);
      }
    }
  }

  return fallback;
}

function pickBoolean(...values: unknown[]): boolean | null {
  for (const value of values) {
    if (typeof value === "boolean") {
      return value;
    }
  }

  return null;
}

function toCustomerStatus(value: unknown): CustomerStatus {
  if (typeof value !== "string") {
    return "active";
  }

  switch (value.trim().toLowerCase()) {
    case "active":
      return "active";
    case "inactive":
      return "inactive";
    case "blocked":
      return "blocked";
    case "pending":
    case "pending_review":
    case "pending-review":
      return "pending_review";
    default:
      return "active";
  }
}

function resolveCustomersListPath(filters: CustomerListFilters): string {
  const endpoint = import.meta.env.VITE_BACKOFFICE_CUSTOMERS_ENDPOINT ?? DEFAULT_CUSTOMERS_LIST_ENDPOINT;
  const [path, queryString = ""] = endpoint.split("?");
  const searchParams = new URLSearchParams(queryString);

  searchParams.set("page", String(filters.page));
  searchParams.set("limit", String(filters.limit));

  if (filters.search) {
    searchParams.set("search", filters.search);
  } else {
    searchParams.delete("search");
  }

  if (filters.status !== "all") {
    searchParams.set("status", filters.status);
  } else {
    searchParams.delete("status");
  }

  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

function resolveCustomerDetailPath(customerId: string): string {
  const endpoint = import.meta.env.VITE_BACKOFFICE_CUSTOMER_DETAIL_ENDPOINT ?? DEFAULT_CUSTOMER_DETAIL_ENDPOINT;
  const encodedId = encodeURIComponent(customerId);

  if (endpoint.includes("{id}")) {
    return endpoint.replace("{id}", encodedId);
  }

  return `${endpoint.replace(/\/$/, "")}/${encodedId}`;
}

function pickListItems(response: unknown): unknown[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (!isRecord(response)) {
    return [];
  }

  for (const key of ["items", "data", "results", "customers"]) {
    const value = response[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  if (isRecord(response.data)) {
    for (const key of ["items", "results", "customers"]) {
      const value = response.data[key];
      if (Array.isArray(value)) {
        return value;
      }
    }
  }

  return [];
}

function pickPagination(
  response: unknown,
  requestedPage: number,
  requestedLimit: number,
  currentItemsCount: number,
): CustomersPagination {
  if (!isRecord(response)) {
    return customersPaginationSchema.parse({
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

  return customersPaginationSchema.parse({
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: hasNextValue ?? page < totalPages,
    hasPreviousPage: hasPreviousValue ?? page > 1,
  });
}

function toCustomerListItem(raw: unknown, index: number): CustomerListItem {
  const item = isRecord(raw) ? raw : {};

  return customerListItemSchema.parse({
    id: pickText(item.id, item.customerId, item.uuid) ?? `customer-${index}`,
    fullName: pickText(item.fullName, item.name, item.customerName, item.legalName) ?? "Cliente sem nome",
    email: pickText(item.email, item.contactEmail) ?? "-",
    document: pickText(item.document, item.cpfCnpj, item.cpf, item.cnpj) ?? "-",
    segment: pickText(item.segment, item.category, item.customerType, item.type) ?? "Geral",
    status: toCustomerStatus(item.status),
    createdAt: pickText(item.createdAt, item.created_at, item.registeredAt) ?? new Date().toISOString(),
  });
}

function pickDetailPayload(response: unknown): unknown {
  if (!isRecord(response)) {
    return response;
  }

  for (const key of ["data", "item", "customer", "detail"]) {
    if (isRecord(response[key])) {
      return response[key];
    }
  }

  return response;
}

function toCustomerDetail(raw: unknown, customerId: string): CustomerDetail {
  const item = isRecord(raw) ? raw : {};
  const addressRecord = isRecord(item.address)
    ? item.address
    : isRecord(item.location)
      ? item.location
      : null;

  return customerDetailSchema.parse({
    id: pickText(item.id, item.customerId, item.uuid) ?? customerId,
    fullName: pickText(item.fullName, item.name, item.customerName, item.legalName) ?? "Cliente sem nome",
    email: pickText(item.email, item.contactEmail) ?? "-",
    document: pickText(item.document, item.cpfCnpj, item.cpf, item.cnpj) ?? "-",
    segment: pickText(item.segment, item.category, item.customerType, item.type) ?? "Geral",
    status: toCustomerStatus(item.status),
    createdAt: pickText(item.createdAt, item.created_at, item.registeredAt) ?? new Date().toISOString(),
    phone: pickText(item.phone, item.mobile, item.phoneNumber) ?? "-",
    lastPurchaseAt: pickText(item.lastPurchaseAt, item.lastOrderAt, item.lastTransactionAt),
    notes: pickText(item.notes, item.observation, item.comments),
    address: addressRecord
      ? {
          street: pickText(addressRecord.street, addressRecord.addressLine, addressRecord.line1) ?? "-",
          city: pickText(addressRecord.city) ?? "-",
          state: pickText(addressRecord.state, addressRecord.uf) ?? "-",
          zipCode: pickText(addressRecord.zipCode, addressRecord.postalCode) ?? "-",
        }
      : null,
  });
}

export interface ListCustomersParams {
  token: string;
  filters: CustomerListFilters;
}

export async function listCustomers({
  token,
  filters,
}: ListCustomersParams): Promise<CustomersListResult> {
  const parsedFilters = customerListFiltersSchema.parse(filters);

  const response = await apiRequest<unknown>(resolveCustomersListPath(parsedFilters), {
    token,
    method: "GET",
  });

  const rawItems = pickListItems(response);
  const items = rawItems.map(toCustomerListItem);
  const pagination = pickPagination(response, parsedFilters.page, parsedFilters.limit, items.length);

  return customersListResultSchema.parse({
    items,
    pagination,
  });
}

export interface GetCustomerDetailParams {
  token: string;
  customerId: string;
}

export async function getCustomerDetail({
  token,
  customerId,
}: GetCustomerDetailParams): Promise<CustomerDetail> {
  const parsedCustomerId = customerId.trim();

  if (!parsedCustomerId) {
    throw new Error("Customer inválido para detalhamento.");
  }

  const response = await apiRequest<unknown>(resolveCustomerDetailPath(parsedCustomerId), {
    token,
    method: "GET",
  });

  return toCustomerDetail(pickDetailPayload(response), parsedCustomerId);
}
