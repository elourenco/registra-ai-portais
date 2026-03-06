import {
  customerListFiltersSchema,
  customersListResultSchema,
  type CustomerDetail,
  type CustomerListFilters,
  type CustomersListResult,
} from "@registra/shared";

import {
  pickCustomerDetailPayload,
  pickCustomerListItems,
  pickCustomersPagination,
  resolveCustomerDetailPath,
  resolveCustomersListPath,
  toCustomerDetail,
  toCustomerListItem,
} from "@/features/customers/core/customer-response";
import { apiRequest } from "@/shared/api/http-client";

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

  const rawItems = pickCustomerListItems(response);
  const items = rawItems.map(toCustomerListItem);
  const pagination = pickCustomersPagination(
    response,
    parsedFilters.page,
    parsedFilters.limit,
    items.length,
  );

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

  return toCustomerDetail(pickCustomerDetailPayload(response), parsedCustomerId);
}
