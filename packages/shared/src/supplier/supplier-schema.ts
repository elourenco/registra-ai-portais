import { z } from "zod";

export const supplierStatusSchema = z.enum(["active", "draft"]);

export const supplierInternalUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().min(1),
  phone: z.string().nullable(),
  role: z.string().nullable(),
  status: z.string().nullable(),
  createdAt: z.string().nullable(),
});

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
  legalRepresentativeName: z.string().nullable(),
  contactName: z.string().nullable(),
  phone: z.string().nullable(),
  zipCode: z.string().nullable(),
  street: z.string().nullable(),
  number: z.string().nullable(),
  complement: z.string().nullable(),
  district: z.string().nullable(),
  notes: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  updatedAt: z.string().nullable(),
  internalUsers: z.array(supplierInternalUserSchema),
});

export const supplierProcessStatusSchema = z.enum([
  "in_progress",
  "completed",
  "cancelled",
]);

export const supplierProcessListItemSchema = z.object({
  id: z.string().min(1),
  protocol: z.string().min(1),
  title: z.string().min(1),
  developmentName: z.string().nullable(),
  workflowName: z.string().min(1),
  currentStepName: z.string().nullable(),
  status: supplierProcessStatusSchema,
  createdAt: z.string().min(1),
  updatedAt: z.string().nullable(),
});

export const supplierDevelopmentStatusSchema = z.enum([
  "drafting",
  "commercialization",
  "registry",
  "completed",
]);

export const supplierDevelopmentListItemSchema = z.object({
  id: z.string().min(1),
  supplierId: z.string().nullable(),
  name: z.string().min(1),
  cnpj: z.string().min(1),
  address: z.string().min(1),
  status: supplierDevelopmentStatusSchema,
  buyersCount: z.number().int().min(0),
});

export const supplierDevelopmentDetailSchema = z.object({
  id: z.string().min(1),
  supplierId: z.string().nullable(),
  supplierCustomName: z.string().nullable(),
  name: z.string().min(1),
  cnpj: z.string().min(1),
  legalName: z.string().min(1),
  tradeName: z.string().nullable(),
  developmentType: z.string().min(1),
  incorporationRegistrationNumber: z.string().min(1),
  incorporationRegistrationDate: z.string().min(1),
  masterRegistrationNumber: z.string().min(1),
  postalCode: z.string().min(1),
  address: z.string().min(1),
  number: z.string().min(1),
  complement: z.string().nullable(),
  neighborhood: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  registryOfficeName: z.string().min(1),
  registryOfficeNumber: z.string().min(1),
  registryOfficeCity: z.string().min(1),
  registryOfficeState: z.string().min(1),
  totalUnits: z.number().int().min(1),
  totalTowers: z.number().int().min(1),
  parkingSpots: z.number().int().min(0).nullable(),
  status: supplierDevelopmentStatusSchema,
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const supplierDevelopmentBuyerStatusSchema = z.enum([
  "pending",
  "active",
  "completed",
  "inactive",
]);

export const supplierDevelopmentBuyerSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  cpf: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  processId: z.string().nullable(),
  unitLabel: z.string().nullable(),
  status: supplierDevelopmentBuyerStatusSchema,
});

export const supplierDevelopmentProcessSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  status: supplierProcessStatusSchema,
  currentStepName: z.string().nullable(),
  createdAt: z.string().min(1),
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

export const supplierDevelopmentListResultSchema = z.object({
  items: z.array(supplierDevelopmentListItemSchema),
  pagination: suppliersPaginationSchema,
});

export const supplierDevelopmentContextSchema = z.object({
  development: supplierDevelopmentDetailSchema,
  buyers: z.array(supplierDevelopmentBuyerSummarySchema),
  processes: z.array(supplierDevelopmentProcessSummarySchema),
});

export type SupplierStatus = z.infer<typeof supplierStatusSchema>;
export type SupplierInternalUser = z.infer<typeof supplierInternalUserSchema>;
export type SupplierListItem = z.infer<typeof supplierListItemSchema>;
export type SupplierDetail = z.infer<typeof supplierDetailSchema>;
export type SupplierProcessStatus = z.infer<typeof supplierProcessStatusSchema>;
export type SupplierProcessListItem = z.infer<typeof supplierProcessListItemSchema>;
export type SupplierDevelopmentStatus = z.infer<typeof supplierDevelopmentStatusSchema>;
export type SupplierDevelopmentListItem = z.infer<typeof supplierDevelopmentListItemSchema>;
export type SupplierDevelopmentDetail = z.infer<typeof supplierDevelopmentDetailSchema>;
export type SupplierDevelopmentBuyerStatus = z.infer<typeof supplierDevelopmentBuyerStatusSchema>;
export type SupplierDevelopmentBuyerSummary = z.infer<
  typeof supplierDevelopmentBuyerSummarySchema
>;
export type SupplierDevelopmentProcessSummary = z.infer<
  typeof supplierDevelopmentProcessSummarySchema
>;
export type SuppliersPagination = z.infer<typeof suppliersPaginationSchema>;
export type SuppliersListResult = z.infer<typeof suppliersListResultSchema>;
export type SupplierProcessesListResult = z.infer<typeof supplierProcessesListResultSchema>;
export type SupplierDevelopmentListResult = z.infer<typeof supplierDevelopmentListResultSchema>;
export type SupplierDevelopmentContext = z.infer<typeof supplierDevelopmentContextSchema>;
