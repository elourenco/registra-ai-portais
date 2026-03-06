import {
  supplierProcessesListResultSchema,
  suppliersListResultSchema,
  type SupplierDetail,
  type SupplierProcessesListResult,
  type SuppliersListResult,
} from "@registra/shared";

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
import { apiRequest } from "@/shared/api/http-client";

export interface ListSuppliersParams {
  token: string;
  page: number;
  limit: number;
}

export async function listSuppliers({
  token,
  page,
  limit,
}: ListSuppliersParams): Promise<SuppliersListResult> {
  const response = await apiRequest<unknown>(resolveSuppliersListPath(page, limit), {
    token,
    method: "GET",
  });

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

  const response = await apiRequest<unknown>(
    resolveSupplierProcessesPath(parsedSupplierId, page, limit),
    {
      token,
      method: "GET",
    },
  );

  const rawItems = pickSupplierItems(response, [
    "items",
    "data",
    "results",
    "processes",
    "processInstances",
  ]);
  const items = rawItems.map(toSupplierProcessListItem);
  const pagination = pickSuppliersPagination(response, page, limit, items.length);

  return supplierProcessesListResultSchema.parse({
    items,
    pagination,
  });
}
