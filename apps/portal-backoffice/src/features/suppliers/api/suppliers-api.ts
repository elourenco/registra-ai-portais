import { apiRequest } from "@/shared/api/http-client";

export interface SupplierListItem {
  id: string;
  legalName: string;
  cnpj: string;
  email: string;
  status: string;
  createdAt: string;
}

export interface SuppliersPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ListSuppliersParams {
  token: string;
  page: number;
  limit: number;
}

export interface ListSuppliersResponse {
  items: SupplierListItem[];
  pagination: SuppliersPagination;
}

const DEFAULT_SUPPLIERS_ENDPOINT = "/api/v1/supplier/companies";

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

function resolveSuppliersPath(page: number, limit: number): string {
  const endpoint = import.meta.env.VITE_BACKOFFICE_SUPPLIERS_ENDPOINT ?? DEFAULT_SUPPLIERS_ENDPOINT;
  const [path, queryString = ""] = endpoint.split("?");
  const searchParams = new URLSearchParams(queryString);

  searchParams.set("page", String(page));
  searchParams.set("limit", String(limit));

  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

function pickItems(response: unknown): unknown[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (!isRecord(response)) {
    return [];
  }

  for (const key of ["items", "data", "results", "companies", "suppliers"]) {
    const value = response[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  if (isRecord(response.data)) {
    for (const key of ["items", "results", "companies", "suppliers"]) {
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
): SuppliersPagination {
  if (!isRecord(response)) {
    return {
      page: requestedPage,
      limit: requestedLimit,
      totalItems: currentItemsCount,
      totalPages: currentItemsCount > 0 ? requestedPage : 1,
      hasNextPage: false,
      hasPreviousPage: requestedPage > 1,
    };
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

  const parsedTotalPages = pickNumber(
    0,
    response.totalPages,
    nestedPagination?.totalPages,
  );

  const totalPages = Math.max(
    1,
    parsedTotalPages > 0 ? parsedTotalPages : Math.ceil(totalItems / limit) || 1,
  );

  const hasNextValue = pickBoolean(response.hasNextPage, nestedPagination?.hasNextPage);
  const hasPreviousValue = pickBoolean(response.hasPreviousPage, nestedPagination?.hasPreviousPage);

  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: hasNextValue ?? page < totalPages,
    hasPreviousPage: hasPreviousValue ?? page > 1,
  };
}

function toSupplierCompany(raw: unknown, index: number): SupplierListItem {
  const item = isRecord(raw) ? raw : {};

  return {
    id: pickText(item.id, item.companyId, item.supplierId) ?? `supplier-${index}`,
    legalName:
      pickText(item.legalName, item.tradeName, item.name, item.companyName, item.razaoSocial) ?? "-",
    cnpj: pickText(item.cnpj, item.document, item.cnpjNumber) ?? "-",
    email: pickText(item.contactEmail, item.email) ?? "-",
    status: pickText(item.status) ?? "-",
    createdAt: pickText(item.createdAt, item.created_at) ?? "",
  };
}

export async function listSuppliers({
  token,
  page,
  limit,
}: ListSuppliersParams): Promise<ListSuppliersResponse> {
  const response = await apiRequest<unknown>(resolveSuppliersPath(page, limit), {
    token,
    method: "GET",
  });

  const rawItems = pickItems(response);
  const items = rawItems.map(toSupplierCompany);
  const pagination = pickPagination(response, page, limit, items.length);

  return {
    items,
    pagination,
  };
}
