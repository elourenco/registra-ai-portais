import {
  supplierDevelopmentListResultSchema,
  supplierProcessesListResultSchema,
  suppliersListResultSchema,
  type SupplierDevelopmentContext,
  type SupplierDevelopmentListItem,
  type SupplierDetail,
  type SupplierProcessesListResult,
  type SuppliersListResult,
} from "@registra/shared";
import { apiRequest } from "@/shared/api/http-client";

import {
  resolveDevelopmentDetailPath,
  resolveSupplierDevelopmentsPath,
  pickSupplierDetailPayload,
  pickSupplierItems,
  pickSuppliersPagination,
  toSupplierDevelopmentContext,
  toSupplierDevelopmentListResult,
  resolveSupplierDetailPath,
  resolveSupplierProcessesPath,
  resolveSuppliersListPath,
  toSupplierDetail,
  toSupplierListItem,
  toSupplierProcessListItem,
} from "@/features/suppliers/core/supplier-response";

export interface ListSuppliersParams {
  cnpj?: string;
  name?: string;
  status?: "active" | "draft";
  token: string;
  page: number;
  limit: number;
}

export async function listSuppliers({
  cnpj,
  name,
  status,
  token,
  page,
  limit,
}: ListSuppliersParams): Promise<SuppliersListResult> {
  const response = await apiRequest<unknown>(
    resolveSuppliersListPath(page, limit, {
      cnpj,
      name,
      status,
    }),
    {
      token,
      method: "GET",
    },
  );

  const rawItems = pickSupplierItems(response, [
    "items",
    "data",
    "results",
    "companies",
    "suppliers",
  ]);
  const items = rawItems.map(toSupplierListItem);
  const pagination = pickSuppliersPagination(response, page, limit, items.length);

  return suppliersListResultSchema.parse({
    items,
    pagination,
  });
}

export interface GetSupplierDetailParams {
  token: string;
  supplierId: string;
}

function paginateClientSide<TItem>(items: TItem[], page: number, limit: number) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit) || 1);
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (currentPage - 1) * limit;

  return {
    items: items.slice(startIndex, startIndex + limit),
    pagination: {
      page: currentPage,
      limit,
      totalItems,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    },
  };
}

export async function getSupplierDetail({
  token,
  supplierId,
}: GetSupplierDetailParams): Promise<SupplierDetail> {
  const parsedSupplierId = supplierId.trim();

  if (!parsedSupplierId) {
    throw new Error("Supplier inválido para detalhamento.");
  }

  const response = await apiRequest<unknown>(resolveSupplierDetailPath(parsedSupplierId), {
    token,
    method: "GET",
  });

  return toSupplierDetail(pickSupplierDetailPayload(response), parsedSupplierId);
}

export interface ListSupplierProcessesParams {
  token: string;
  supplierId: string;
  page: number;
  limit: number;
}

export async function listSupplierProcesses({
  token,
  supplierId,
  page,
  limit,
}: ListSupplierProcessesParams): Promise<SupplierProcessesListResult> {
  const parsedSupplierId = supplierId.trim();

  if (!parsedSupplierId) {
    throw new Error("Supplier inválido para listar processos.");
  }

  const response = await apiRequest<unknown>(resolveSupplierProcessesPath(parsedSupplierId), {
    token,
    method: "GET",
  });

  const rawItems = pickSupplierItems(response, [
    "items",
    "data",
    "results",
    "processes",
    "processInstances",
  ]);
  const items = rawItems
    .map(toSupplierProcessListItem)
    .sort((left, right) => {
      const leftDate = Date.parse(left.updatedAt ?? left.createdAt);
      const rightDate = Date.parse(right.updatedAt ?? right.createdAt);
      return (Number.isNaN(rightDate) ? 0 : rightDate) - (Number.isNaN(leftDate) ? 0 : leftDate);
    });
  const { items: paginatedItems, pagination } = paginateClientSide(items, page, limit);

  return supplierProcessesListResultSchema.parse({
    items: paginatedItems,
    pagination,
  });
}

interface ListSupplierDevelopmentsParams {
  supplierId: string;
  token: string;
}

export async function listSupplierDevelopments({
  supplierId,
  token,
}: ListSupplierDevelopmentsParams): Promise<SupplierDevelopmentListItem[]> {
  const parsedSupplierId = supplierId.trim();

  if (!parsedSupplierId) {
    throw new Error("Supplier inválido para listar empreendimentos.");
  }

  const items: SupplierDevelopmentListItem[] = [];
  let page = 1;
  const limit = 100;
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await apiRequest<unknown>(
      resolveSupplierDevelopmentsPath(page, limit, parsedSupplierId),
      {
        token,
        method: "GET",
      },
    );
    const result = toSupplierDevelopmentListResult(response, page, limit);

    items.push(...result.items);
    hasNextPage = result.pagination.hasNextPage;
    page += 1;
  }

  return supplierDevelopmentListResultSchema.shape.items.parse(items);
}

interface GetSupplierDevelopmentContextParams {
  developmentId: string;
  token: string;
}

export async function getSupplierDevelopmentContext({
  developmentId,
  token,
}: GetSupplierDevelopmentContextParams): Promise<SupplierDevelopmentContext> {
  const parsedDevelopmentId = developmentId.trim();

  if (!parsedDevelopmentId) {
    throw new Error("Empreendimento inválido para detalhamento.");
  }

  const response = await apiRequest<unknown>(resolveDevelopmentDetailPath(parsedDevelopmentId), {
    token,
    method: "GET",
  });

  return toSupplierDevelopmentContext(response, parsedDevelopmentId);
}
