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

/** Alinhado a `ProcessDocumentResponse.status` na OpenAPI (`GET /api/v1/workflows/.../processes/{processId}`). */
export const workflowProcessDocumentStatusSchema = z.enum([
  "uploaded",
  "under_review",
  "approved",
  "rejected",
  "replaced",
]);
export type WorkflowProcessDocumentStatus = z.infer<typeof workflowProcessDocumentStatusSchema>;

export const contractControlStatusSchema = z.enum([
  "pending_generation",
  "awaiting_document_upload",
  "awaiting_signature",
  "signed",
  "completed",
  "cancelled",
]);
export type ContractControlStatus = z.infer<typeof contractControlStatusSchema>;

export const workflowStageContractControlSchema = z.object({
  signatureUrl: z.string().trim().nullable().optional(),
  status: contractControlStatusSchema,
  updatedAt: z.string().optional(),
  updatedBy: z
    .object({
      id: z.string().optional(),
      name: z.string().optional(),
    })
    .optional(),
});
export type WorkflowStageContractControl = z.infer<typeof workflowStageContractControlSchema>;

export const workflowStageDocumentSchema = z.object({
  id: z.string().min(1),
  processId: z.string().min(1),
  requestId: z.string().nullable().optional(),
  workflowStageId: z.string().nullable().optional(),
  supplierId: z.string().optional(),
  block: z.string().optional(),
  type: z.string().min(1),
  uploadedBy: z.string().optional(),
  originalFileName: z.string().optional(),
  mimeType: z.string().optional(),
  fileSize: z.number().optional(),
  version: z.number().optional(),
  status: workflowProcessDocumentStatusSchema,
  comments: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type WorkflowStageDocument = z.infer<typeof workflowStageDocumentSchema>;

/** Instância de processo por etapa (`SupplierProcessStageStatus.process` na OpenAPI). */
export const workflowStageProcessSchema = z.object({
  id: z.string().min(1),
  supplierCompanyId: z.string().optional(),
  workflowId: z.string().optional(),
  stageId: z.string().nullable().optional(),
  name: z.string().optional(),
  status: z.string().optional(),
  createdByUserId: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  completedAt: z.string().nullable().optional(),
  documents: z.array(workflowStageDocumentSchema).default([]),
  contractControl: z.union([workflowStageContractControlSchema, z.null()]).optional(),
});
export type WorkflowStageProcess = z.infer<typeof workflowStageProcessSchema>;

export const processStageNoteSchema = z.object({
  id: z.string().min(1),
  processId: z.string().min(1),
  stageId: z.string().min(1),
  note: z.string().min(1),
  createdAt: z.string().optional(),
  createdBy: z
    .object({
      id: z.string().optional(),
      name: z.string().optional(),
    })
    .nullable()
    .optional(),
});
export type ProcessStageNote = z.infer<typeof processStageNoteSchema>;

export const processDetailBuyerSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  hasEnotariadoCertificate: z.boolean().nullable(),
  email: z.string().optional(),
  phone: z.string().optional(),
  cpf: z.string().optional(),
  street: z.string().optional(),
  number: z.string().nullable().optional(),
  complement: z.string().nullable().optional(),
  neighborhood: z.string().nullable().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  address: z.string().optional(),
  maritalStatus: z.string().optional(),
  spouseName: z.string().nullable().optional(),
  spouseCpf: z.string().nullable().optional(),
  unitLabel: z.string().nullable().optional(),
  acquisitionType: z.string().nullable().optional(),
  processId: z.string().nullable().optional(),
  basicDataConfirmedAt: z.string().nullable().optional(),
});
export type ProcessDetailBuyer = z.infer<typeof processDetailBuyerSchema>;

export const processStageSchema = z.object({
  id: z.string().min(1),
  workflowId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  order: z.number().int().min(1),
  status: processStageStatusSchema,
  rules: z.array(processStageRuleSchema).default([]),
  notes: z.array(processStageNoteSchema).default([]),
  process: z.union([workflowStageProcessSchema, z.null()]).optional(),
});
export type ProcessStage = z.infer<typeof processStageSchema>;

export const advanceProcessResultSchema = z.object({
  completedProcess: z.object({
    id: z.string().min(1),
    status: z.literal("completed"),
    stageId: z.string().min(1),
    completedAt: z.string().optional(),
  }),
  nextProcess: z
    .object({
      id: z.string().min(1),
      status: z.literal("in_progress"),
      stageId: z.string().min(1),
      createdAt: z.string().optional(),
    })
    .nullable(),
  workflowCompleted: z.boolean(),
  stages: z.array(processStageSchema).default([]),
});
export type AdvanceProcessResult = z.infer<typeof advanceProcessResultSchema>;

export const updateContractControlResultSchema = z.object({
  processId: z.string().min(1),
  stageId: z.string().min(1),
  signatureUrl: z.string().trim().nullable().optional(),
  contractControlStatus: contractControlStatusSchema,
  updatedAt: z.string().optional(),
  updatedBy: z
    .object({
      id: z.string().optional(),
      name: z.string().optional(),
    })
    .optional(),
});
export type UpdateContractControlResult = z.infer<typeof updateContractControlResultSchema>;

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
  stageId: z.string().nullable(),
  stageName: z.string().nullable(),
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
  buyer: processDetailBuyerSchema.nullable().optional(),
});
export type ProcessDetail = z.infer<typeof processDetailSchema>;
