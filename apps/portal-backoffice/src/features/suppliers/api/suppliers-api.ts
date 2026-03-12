import {
  supplierProcessesListResultSchema,
  suppliersListResultSchema,
  type SupplierDetail,
  type SupplierProcessesListResult,
  type SuppliersListResult,
} from "@registra/shared";
import { ApiClientError, apiRequest } from "@/shared/api/http-client";
import {
  getSandboxSupplierDetail,
  getSandboxSupplierList,
  getSandboxSupplierProcesses,
} from "../../../../../../sandbox/mocks/suppliers/active-supplier-company";

import {
  pickSupplierDetailPayload,
  pickSupplierItems,
  pickSuppliersPagination,
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
  const sandboxResult = getSandboxSupplierList({ page, limit, cnpj, name, status });

  try {
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
    const hasSandboxItem = items.some((item) => item.id === sandboxResult.items[0]?.id);

    return suppliersListResultSchema.parse({
      items: hasSandboxItem ? items : [...sandboxResult.items, ...items],
      pagination: {
        ...pagination,
        totalItems: pagination.totalItems + (hasSandboxItem ? 0 : sandboxResult.items.length),
        totalPages: Math.max(
          pagination.totalPages,
          Math.ceil((pagination.totalItems + (hasSandboxItem ? 0 : sandboxResult.items.length)) / pagination.limit),
        ),
      },
    });
  } catch (error) {
    if (error instanceof ApiClientError || error instanceof Error) {
      return suppliersListResultSchema.parse(sandboxResult);
    }

    throw error;
  }
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

  try {
    const response = await apiRequest<unknown>(resolveSupplierDetailPath(parsedSupplierId), {
      token,
      method: "GET",
    });

    return toSupplierDetail(pickSupplierDetailPayload(response), parsedSupplierId);
  } catch (error) {
    if (error instanceof ApiClientError || error instanceof Error) {
      const sandboxDetail = getSandboxSupplierDetail(parsedSupplierId);
      if (sandboxDetail) {
        return sandboxDetail;
      }
    }

    throw error;
  }
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

  try {
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
  } catch (error) {
    if (error instanceof ApiClientError || error instanceof Error) {
      const sandboxProcesses = getSandboxSupplierProcesses(parsedSupplierId, page, limit);
      if (sandboxProcesses) {
        return supplierProcessesListResultSchema.parse(sandboxProcesses);
      }
    }

    throw error;
  }
}
