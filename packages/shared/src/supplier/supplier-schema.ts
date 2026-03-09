import { z } from "zod";

export const supplierStatusSchema = z.enum(["active", "pending_onboarding", "suspended", "draft"]);

export const supplierListItemSchema = z.object({
  id: z.string().min(1),
  legalName: z.string().min(1),
  cnpj: z.string().min(1),
  email: z.string().min(1),
  workflowId: z.string().nullable(),
  workflowName: z.string().nullable(),
  status: supplierStatusSchema,
  createdAt: z.string().min(1),
});

export const supplierDetailSchema = supplierListItemSchema.extend({
  tradeName: z.string().nullable(),
  contactName: z.string().nullable(),
  phone: z.string().nullable(),
  notes: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

export const supplierProcessStatusSchema = z.enum([
  "created",
  "in_progress",
  "completed",
  "blocked",
  "cancelled",
]);

export const supplierProcessListItemSchema = z.object({
  id: z.string().min(1),
  protocol: z.string().min(1),
  title: z.string().min(1),
  workflowName: z.string().min(1),
  currentStepName: z.string().nullable(),
  status: supplierProcessStatusSchema,
  createdAt: z.string().min(1),
  updatedAt: z.string().nullable(),
});

export const suppliersPaginationSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  totalItems: z.number().int().min(0),
  totalPages: z.number().int().min(1),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});

export const suppliersListResultSchema = z.object({
  items: z.array(supplierListItemSchema),
  pagination: suppliersPaginationSchema,
});

export const supplierProcessesListResultSchema = z.object({
  items: z.array(supplierProcessListItemSchema),
  pagination: suppliersPaginationSchema,
});

export type SupplierStatus = z.infer<typeof supplierStatusSchema>;
export type SupplierListItem = z.infer<typeof supplierListItemSchema>;
export type SupplierDetail = z.infer<typeof supplierDetailSchema>;
export type SupplierProcessStatus = z.infer<typeof supplierProcessStatusSchema>;
export type SupplierProcessListItem = z.infer<typeof supplierProcessListItemSchema>;
export type SuppliersPagination = z.infer<typeof suppliersPaginationSchema>;
export type SuppliersListResult = z.infer<typeof suppliersListResultSchema>;
export type SupplierProcessesListResult = z.infer<typeof supplierProcessesListResultSchema>;
