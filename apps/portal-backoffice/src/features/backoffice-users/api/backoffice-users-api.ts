import {
  backofficeUserListFiltersSchema,
  backofficeUsersListResultSchema,
  createBackofficeUserSchema,
  updateBackofficeUserSchema,
  type BackofficeUserListFilters,
  type BackofficeUsersListResult,
  type CreateBackofficeUserInput,
  type UpdateBackofficeUserInput,
} from "@registra/shared";

import {
  pickBackofficeUserItems,
  pickBackofficeUsersPagination,
  resolveBackofficeUserCreatePath,
  resolveBackofficeUserPath,
  resolveBackofficeUsersListPath,
  toBackofficeUser,
} from "@/features/backoffice-users/core/backoffice-user-response";
import { apiRequest } from "@/shared/api/http-client";

interface BackofficeUserAuthParams {
  token: string;
}

export interface ListBackofficeUsersParams extends BackofficeUserAuthParams {
  filters: BackofficeUserListFilters;
}

export async function listBackofficeUsers({
  token,
  filters,
}: ListBackofficeUsersParams): Promise<BackofficeUsersListResult> {
  const parsedFilters = backofficeUserListFiltersSchema.parse(filters);
  const response = await apiRequest<unknown>(resolveBackofficeUsersListPath(parsedFilters), {
    token,
    method: "GET",
  });

  const rawItems = pickBackofficeUserItems(response);
  const items = rawItems.map(toBackofficeUser);
  const pagination = pickBackofficeUsersPagination(
    response,
    parsedFilters.page,
    parsedFilters.limit,
    items.length,
  );

  return backofficeUsersListResultSchema.parse({
    items,
    pagination,
  });
}

export interface CreateBackofficeUserParams extends BackofficeUserAuthParams {
  input: CreateBackofficeUserInput;
}

export async function createBackofficeUser({
  token,
  input,
}: CreateBackofficeUserParams): Promise<void> {
  const payload = createBackofficeUserSchema.parse(input);

  await apiRequest<unknown>(resolveBackofficeUserCreatePath(), {
    token,
    method: "POST",
    body: JSON.stringify({
      ...payload,
      portal: "backoffice",
    }),
  });
}

export interface UpdateBackofficeUserParams extends BackofficeUserAuthParams {
  input: UpdateBackofficeUserInput;
  userId: string;
}

export async function updateBackofficeUser({
  token,
  userId,
  input,
}: UpdateBackofficeUserParams): Promise<void> {
  const payload = updateBackofficeUserSchema.parse(input);

  await apiRequest<unknown>(resolveBackofficeUserPath(userId), {
    token,
    method: "PATCH",
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      password: payload.password || undefined,
      status: payload.status,
      portal: "backoffice",
    }),
  });
}

export interface DeleteBackofficeUserParams extends BackofficeUserAuthParams {
  userId: string;
}

export async function deleteBackofficeUser({
  token,
  userId,
}: DeleteBackofficeUserParams): Promise<void> {
  await apiRequest<unknown>(resolveBackofficeUserPath(userId), {
    token,
    method: "DELETE",
  });
}
