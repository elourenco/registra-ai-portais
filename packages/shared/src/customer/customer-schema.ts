import { z } from "zod";

export const customerStatusSchema = z.enum(["active", "pending_review", "inactive", "blocked"]);

export const customerListStatusFilterSchema = z.enum([
  "all",
  "active",
  "pending_review",
  "inactive",
  "blocked",
]);

export const customerListFiltersSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(120).default(""),
  status: customerListStatusFilterSchema.default("all"),
});

export const customerListItemSchema = z.object({
  id: z.string().min(1),
  fullName: z.string().min(1),
  email: z.string().min(1),
  document: z.string().min(1),
  segment: z.string().min(1),
  status: customerStatusSchema,
  createdAt: z.string().min(1),
});

export const customerAddressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zipCode: z.string().min(1),
});

export const customerDetailSchema = customerListItemSchema.extend({
  phone: z.string().min(1),
  lastPurchaseAt: z.string().nullable(),
  notes: z.string().nullable(),
  address: customerAddressSchema.nullable(),
});

export const customersPaginationSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  totalItems: z.number().int().min(0),
  totalPages: z.number().int().min(1),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});

export const customersListResultSchema = z.object({
  items: z.array(customerListItemSchema),
  pagination: customersPaginationSchema,
});

export type CustomerStatus = z.infer<typeof customerStatusSchema>;
export type CustomerListStatusFilter = z.infer<typeof customerListStatusFilterSchema>;
export type CustomerListFilters = z.infer<typeof customerListFiltersSchema>;
export type CustomerListItem = z.infer<typeof customerListItemSchema>;
export type CustomerDetail = z.infer<typeof customerDetailSchema>;
export type CustomersPagination = z.infer<typeof customersPaginationSchema>;
export type CustomersListResult = z.infer<typeof customersListResultSchema>;
