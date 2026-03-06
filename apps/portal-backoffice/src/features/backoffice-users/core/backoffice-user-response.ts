import {
  backofficeUserSchema,
  backofficeUsersPaginationSchema,
  type BackofficeUser,
  type BackofficeUserListFilters,
  type BackofficeUserRole,
  type BackofficeUserStatus,
  type BackofficeUsersPagination,
} from "@registra/shared";

import { isRecord, pickBoolean, pickNumber, pickText } from "@/shared/utils/api-normalizers";

export function toBackofficeUserStatus(value: unknown): BackofficeUserStatus {
  if (typeof value !== "string") {
    return "active";
  }

  switch (value.trim().toLowerCase()) {
    case "pending":
    case "pending_onboarding":
    case "pending-onboarding":
      return "pending_onboarding";
    case "suspended":
    case "inactive":
      return "suspended";
    case "active":
    default:
      return "active";
  }
}

export function toBackofficeUserRole(value: unknown): BackofficeUserRole {
  if (typeof value !== "string") {
    return "backoffice_admin";
  }

  return value.trim().toLowerCase() === "backoffice_admin"
    ? "backoffice_admin"
    : "backoffice_admin";
}

export function resolveBackofficeUsersListPath(filters: BackofficeUserListFilters): string {
  const endpoint = import.meta.env.VITE_BACKOFFICE_USERS_ENDPOINT ?? "/api/v1/users";
  const [path, queryString = ""] = endpoint.split("?");
  const searchParams = new URLSearchParams(queryString);

  searchParams.set("page", String(filters.page));
  searchParams.set("limit", String(filters.limit));
  searchParams.set("portal", "backoffice");

  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

export function resolveBackofficeUserPath(userId: string): string {
  const endpoint =
    import.meta.env.VITE_BACKOFFICE_USER_DETAIL_ENDPOINT ?? "/api/v1/users/{userId}";
  const encodedId = encodeURIComponent(userId);

  if (endpoint.includes("{userId}")) {
    return endpoint.replace("{userId}", encodedId);
  }

  if (endpoint.includes("{id}")) {
    return endpoint.replace("{id}", encodedId);
  }

  return `${endpoint.replace(/\/$/, "")}/${encodedId}`;
}

export function resolveBackofficeUserCreatePath(): string {
  return import.meta.env.VITE_BACKOFFICE_USERS_CREATE_ENDPOINT ?? "/api/v1/users";
}

export function pickBackofficeUserItems(response: unknown): unknown[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (!isRecord(response)) {
    return [];
  }

  for (const key of ["items", "data", "results", "users"]) {
    const value = response[key];

    if (Array.isArray(value)) {
      return value;
    }
  }

  if (isRecord(response.data)) {
    for (const key of ["items", "results", "users"]) {
      const value = response.data[key];

      if (Array.isArray(value)) {
        return value;
      }
    }
  }

  return [];
}

export function pickBackofficeUsersPagination(
  response: unknown,
  requestedPage: number,
  requestedLimit: number,
  currentItemsCount: number,
): BackofficeUsersPagination {
  if (!isRecord(response)) {
    return backofficeUsersPaginationSchema.parse({
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
      nestedPagination?.total,
      nestedPagination?.totalItems,
      nestedPagination?.totalCount,
    ),
  );
  const parsedTotalPages = pickNumber(0, response.totalPages, nestedPagination?.totalPages);
  const totalPages = Math.max(
    1,
    parsedTotalPages > 0 ? parsedTotalPages : Math.ceil(totalItems / limit) || 1,
  );
  const hasNextValue = pickBoolean(response.hasNextPage, nestedPagination?.hasNextPage);
  const hasPreviousValue = pickBoolean(response.hasPreviousPage, nestedPagination?.hasPreviousPage);

  return backofficeUsersPaginationSchema.parse({
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: hasNextValue ?? page < totalPages,
    hasPreviousPage: hasPreviousValue ?? page > 1,
  });
}

export function toBackofficeUser(raw: unknown, index: number): BackofficeUser {
  const item = isRecord(raw) ? raw : {};

  return backofficeUserSchema.parse({
    id: pickText(item.id, item.userId) ?? `backoffice-user-${index}`,
    name: pickText(item.name, item.fullName) ?? "Usuário sem nome",
    email: pickText(item.email) ?? `usuario-${index}@registra.local`,
    role: toBackofficeUserRole(item.role),
    status: toBackofficeUserStatus(item.status),
    createdAt: pickText(item.createdAt, item.created_at, item.updatedAt) ?? new Date().toISOString(),
  });
}
