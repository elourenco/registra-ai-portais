import { z } from "zod";

export const processListStatusSchema = z.enum([
  "in_progress",
  "completed",
  "cancelled",
  "waiting_supplier",
  "waiting_registry_office",
  "requirement_open",
  "overdue",
]);
export type ProcessListStatus = z.infer<typeof processListStatusSchema>;

export const processWaitingOnSchema = z.enum([
  "buyer",
  "supplier",
  "backoffice",
  "registry_office",
]).nullable();
export type ProcessWaitingOn = z.infer<typeof processWaitingOnSchema>;

export const processStageStatusSchema = z.enum(["pending", "in_progress", "completed"]);
export type ProcessStageStatus = z.infer<typeof processStageStatusSchema>;

export const processStageRuleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  status: z.enum(["pending", "completed"]).default("pending"),
  completedAt: z.string().nullable().optional(),
  evidence: z.string().nullable().optional(),
});
export type ProcessStageRule = z.infer<typeof processStageRuleSchema>;

export const processStageSchema = z.object({
  id: z.string().min(1),
  workflowId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  order: z.number().int().min(1),
  status: processStageStatusSchema,
  rules: z.array(processStageRuleSchema).default([]),
});
export type ProcessStage = z.infer<typeof processStageSchema>;

export const processListItemSchema = z.object({
  id: z.string().min(1),
  supplierCompanyId: z.string().min(1),
  supplierName: z.string().nullable(),
  developmentId: z.string().nullable(),
  developmentName: z.string().nullable(),
  buyerId: z.string().nullable(),
  buyerName: z.string().nullable(),
  propertyLabel: z.string().min(1),
  registrationNumber: z.string().nullable(),
  status: processListStatusSchema,
  workflowId: z.string().nullable(),
  workflowName: z.string().nullable(),
  currentStageId: z.string().nullable(),
  currentStageName: z.string().nullable(),
  pendingRequirements: z.number().int().min(0).default(0),
  waitingOn: processWaitingOnSchema,
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  dueAt: z.string().nullable(),
});
export type ProcessListItem = z.infer<typeof processListItemSchema>;

export const processPaginationSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  totalItems: z.number().int().min(0),
  totalPages: z.number().int().min(1),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});
export type ProcessPagination = z.infer<typeof processPaginationSchema>;

export const processListResultSchema = z.object({
  items: z.array(processListItemSchema),
  pagination: processPaginationSchema,
});
export type ProcessListResult = z.infer<typeof processListResultSchema>;

export const processDetailSchema = processListItemSchema.extend({
  name: z.string().min(1).optional(),
  workflow: z
    .object({
      id: z.string().min(1),
      name: z.string().min(1),
    })
    .nullable(),
  stages: z.array(processStageSchema),
});
export type ProcessDetail = z.infer<typeof processDetailSchema>;
