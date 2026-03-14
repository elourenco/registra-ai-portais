import { z } from "zod";

export const registrationSupplierStatusSchema = z.enum(["active", "onboarding", "inactive", "blocked"]);
export type RegistrationSupplierStatus = z.infer<typeof registrationSupplierStatusSchema>;

export const registrationDevelopmentStatusSchema = z.enum(["active", "launching", "completed", "blocked"]);
export type RegistrationDevelopmentStatus = z.infer<typeof registrationDevelopmentStatusSchema>;

export const registrationBuyerStatusSchema = z.enum(["active", "pending_documents", "blocked"]);
export type RegistrationBuyerStatus = z.infer<typeof registrationBuyerStatusSchema>;

export const processStatusSchema = z.enum([
  "active",
  "waiting_supplier",
  "waiting_registry_office",
  "requirement_open",
  "overdue",
  "completed",
  "cancelled",
]);
export type ProcessStatus = z.infer<typeof processStatusSchema>;

export const workflowBlockKeySchema = z.enum(["certificate", "contract", "registration"]);
export type WorkflowBlockKey = z.infer<typeof workflowBlockKeySchema>;

export const workflowBlockStatusSchema = z.enum([
  "pending",
  "waiting_supplier",
  "in_review",
  "rejected",
  "approved",
  "in_preparation",
  "waiting_signature",
  "signed",
  "waiting_payment",
  "in_registry",
  "waiting_registry_office",
  "requirement_open",
  "requirement_resolved",
  "registered",
]);
export type WorkflowBlockStatus = z.infer<typeof workflowBlockStatusSchema>;

export const requestTypeSchema = z.enum([
  "document_submission",
  "information_confirmation",
  "contract_submission",
  "signature",
  "payment",
  "correction",
]);
export type RequestType = z.infer<typeof requestTypeSchema>;

export const requestTargetSchema = z.enum(["supplier", "buyer"]);
export type RequestTarget = z.infer<typeof requestTargetSchema>;

export const requestStatusSchema = z.enum([
  "created",
  "sent",
  "responded",
  "in_review",
  "approved",
  "rejected",
  "resubmission_requested",
  "completed",
]);
export type RequestStatus = z.infer<typeof requestStatusSchema>;

export const taskTypeSchema = z.enum(["contact", "validation", "analysis", "correction", "sending", "follow_up"]);
export type TaskType = z.infer<typeof taskTypeSchema>;

export const taskStatusSchema = z.enum(["pending", "in_progress", "completed", "cancelled"]);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

export const documentTypeSchema = z.enum([
  "personal_documents",
  "deed",
  "contract",
  "itbi_receipt",
  "registered_deed",
]);
export type DocumentType = z.infer<typeof documentTypeSchema>;

export const documentStatusSchema = z.enum([
  "sent",
  "in_review",
  "approved",
  "rejected",
  "resubmission_requested",
  "replaced",
]);
export type DocumentStatus = z.infer<typeof documentStatusSchema>;

export const documentUploadedBySchema = z.enum(["supplier", "buyer", "backoffice"]);
export type DocumentUploadedBy = z.infer<typeof documentUploadedBySchema>;

export const requirementStatusSchema = z.enum(["open", "in_resolution", "resolved"]);
export type RequirementStatus = z.infer<typeof requirementStatusSchema>;

export const billingStatusSchema = z.enum(["pending", "paid", "waived"]);
export type BillingStatus = z.infer<typeof billingStatusSchema>;

export const registrationSupplierSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2),
  cnpj: z.string().min(14),
  contactName: z.string().min(2),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(8),
  status: registrationSupplierStatusSchema,
  statusReason: z.enum(["payment", "manual"]).nullable(),
  developmentsCount: z.number().int().min(0),
});
export type RegistrationSupplier = z.infer<typeof registrationSupplierSchema>;

export const developmentSchema = z.object({
  id: z.string().min(1),
  supplierId: z.string().min(1),
  name: z.string().min(2),
  cnpj: z.string().min(14),
  legalName: z.string().min(2).nullable().optional(),
  tradeName: z.string().trim().nullable().optional(),
  developmentType: z.string().min(2).nullable().optional(),
  incorporationRegistrationNumber: z.string().trim().nullable().optional(),
  incorporationRegistrationDate: z.string().trim().nullable().optional(),
  masterRegistrationNumber: z.string().trim().nullable().optional(),
  postalCode: z.string().trim().nullable().optional(),
  address: z.string().min(4),
  number: z.string().trim().nullable().optional(),
  complement: z.string().trim().nullable().optional(),
  neighborhood: z.string().trim().nullable().optional(),
  city: z.string().trim().nullable().optional(),
  state: z.string().trim().nullable().optional(),
  registryOfficeName: z.string().trim().nullable().optional(),
  registryOfficeNumber: z.string().trim().nullable().optional(),
  registryOfficeCity: z.string().trim().nullable().optional(),
  registryOfficeState: z.string().trim().nullable().optional(),
  totalUnits: z.number().int().min(0).nullable().optional(),
  totalTowers: z.number().int().min(0).nullable().optional(),
  parkingSpots: z.number().int().min(0).nullable().optional(),
  status: registrationDevelopmentStatusSchema,
  buyersCount: z.number().int().min(0),
});
export type Development = z.infer<typeof developmentSchema>;

export const buyerSchema = z.object({
  id: z.string().min(1),
  supplierId: z.string().min(1),
  developmentId: z.string().min(1),
  name: z.string().min(2),
  cpf: z.string().min(11),
  email: z.string().email(),
  phone: z.string().min(8),
  processId: z.string().min(1),
  status: registrationBuyerStatusSchema,
  statusReason: z.enum(["supplier_payment", "manual"]).nullable(),
});
export type Buyer = z.infer<typeof buyerSchema>;

export const workflowBlockSchema = z.object({
  key: workflowBlockKeySchema,
  title: z.string().min(2),
  status: workflowBlockStatusSchema,
  supplierActionRequired: z.boolean(),
  validationOwner: z.string().min(2),
  documentsSummary: z.string().min(2),
  latestResponseSummary: z.string().min(2),
  signatureLink: z.string().trim().nullable().optional(),
  generatedContractPdfName: z.string().trim().nullable().optional(),
  lastUpdatedAt: z.string().datetime({ offset: true }),
  canStart: z.boolean(),
  dependsOn: workflowBlockKeySchema.nullable(),
});
export type WorkflowBlock = z.infer<typeof workflowBlockSchema>;

export const processBillingSchema = z.object({
  unitValue: z.number().positive(),
  status: billingStatusSchema,
  chargedAt: z.string().datetime({ offset: true }).nullable(),
  paidAt: z.string().datetime({ offset: true }).nullable(),
});
export type ProcessBilling = z.infer<typeof processBillingSchema>;

export const registrationProcessSchema = z.object({
  id: z.string().min(1),
  supplierId: z.string().min(1),
  developmentId: z.string().min(1),
  buyerId: z.string().min(1),
  propertyLabel: z.string().min(2),
  registrationNumber: z.string().min(2),
  registryOffice: z.string().min(2),
  internalOwner: z.string().min(2),
  currentStep: z.string().min(2),
  status: processStatusSchema,
  createdAt: z.string().datetime({ offset: true }),
  dueAt: z.string().datetime({ offset: true }),
  blocks: z.array(workflowBlockSchema).length(3),
  billing: processBillingSchema,
});
export type RegistrationProcess = z.infer<typeof registrationProcessSchema>;

export const processRequestSchema = z.object({
  id: z.string().min(1),
  processId: z.string().min(1),
  block: workflowBlockKeySchema,
  target: requestTargetSchema,
  title: z.string().min(2),
  type: requestTypeSchema,
  description: z.string().min(2),
  requiredDocuments: z.array(z.string().min(2)).min(1),
  deadline: z.string().datetime({ offset: true }),
  status: requestStatusSchema,
  createdAt: z.string().datetime({ offset: true }),
  sentAt: z.string().datetime({ offset: true }),
  respondedAt: z.string().datetime({ offset: true }).nullable(),
});
export type ProcessRequest = z.infer<typeof processRequestSchema>;

export const processSubmissionSchema = z.object({
  id: z.string().min(1),
  requestId: z.string().min(1),
  submittedBy: documentUploadedBySchema,
  submittedAt: z.string().datetime({ offset: true }),
  notes: z.string().min(2),
});
export type ProcessSubmission = z.infer<typeof processSubmissionSchema>;

export const processTaskSchema = z.object({
  id: z.string().min(1),
  processId: z.string().min(1),
  title: z.string().min(2),
  description: z.string().min(2),
  assignee: z.string().min(2),
  type: taskTypeSchema,
  dueAt: z.string().datetime({ offset: true }),
  status: taskStatusSchema,
});
export type ProcessTask = z.infer<typeof processTaskSchema>;

export const processDocumentSchema = z.object({
  id: z.string().min(1),
  processId: z.string().min(1),
  requestId: z.string().min(1),
  block: workflowBlockKeySchema,
  type: documentTypeSchema,
  name: z.string().min(2),
  fileUrl: z.string().min(2),
  fileSize: z.number().int().positive(),
  status: documentStatusSchema,
  uploadedBy: documentUploadedBySchema,
  version: z.number().int().min(1),
  comments: z.string().trim().nullable(),
  uploadedAt: z.string().datetime({ offset: true }),
});
export type ProcessDocument = z.infer<typeof processDocumentSchema>;

export const processRequirementSchema = z.object({
  id: z.string().min(1),
  processId: z.string().min(1),
  title: z.string().min(2),
  description: z.string().min(2),
  status: requirementStatusSchema,
  supplierActionRequired: z.boolean(),
  createdAt: z.string().datetime({ offset: true }),
});
export type ProcessRequirement = z.infer<typeof processRequirementSchema>;

export const processHistoryEventSchema = z.object({
  id: z.string().min(1),
  processId: z.string().min(1),
  occurredAt: z.string().datetime({ offset: true }),
  user: z.string().min(2),
  action: z.string().min(2),
  note: z.string().min(2),
  comment: z.string().trim().nullable(),
});
export type ProcessHistoryEvent = z.infer<typeof processHistoryEventSchema>;

export const processNotificationSchema = z.object({
  id: z.string().min(1),
  processId: z.string().min(1),
  recipient: z.enum(["supplier", "buyer", "backoffice"]),
  title: z.string().min(2),
  description: z.string().min(2),
  createdAt: z.string().datetime({ offset: true }),
});
export type ProcessNotification = z.infer<typeof processNotificationSchema>;

export const processSharedFileAudienceSchema = z.enum(["supplier", "buyer", "both"]);
export type ProcessSharedFileAudience = z.infer<typeof processSharedFileAudienceSchema>;

export const processSharedFileSchema = z.object({
  id: z.string().min(1),
  processId: z.string().min(1),
  block: workflowBlockKeySchema,
  audience: processSharedFileAudienceSchema,
  title: z.string().min(2),
  description: z.string().min(2),
  fileName: z.string().min(2),
  fileUrl: z.string().min(2),
  uploadedBy: z.string().min(2),
  createdAt: z.string().datetime({ offset: true }),
});
export type ProcessSharedFile = z.infer<typeof processSharedFileSchema>;

export const processDetailSchema = z.object({
  process: registrationProcessSchema,
  supplier: registrationSupplierSchema,
  development: developmentSchema,
  buyer: buyerSchema,
  requests: z.array(processRequestSchema),
  submissions: z.array(processSubmissionSchema),
  tasks: z.array(processTaskSchema),
  documents: z.array(processDocumentSchema),
  requirements: z.array(processRequirementSchema),
  notifications: z.array(processNotificationSchema),
  sharedFiles: z.array(processSharedFileSchema),
  history: z.array(processHistoryEventSchema),
});
export type ProcessDetail = z.infer<typeof processDetailSchema>;

export const operationsDashboardSchema = z.object({
  activeProcesses: z.number().int().min(0),
  waitingSupplier: z.number().int().min(0),
  waitingRegistryOffice: z.number().int().min(0),
  processesWithRequirement: z.number().int().min(0),
  overdueProcesses: z.number().int().min(0),
  pendingTasks: z.number().int().min(0),
  documentsWaitingValidation: z.number().int().min(0),
  criticalProcesses: z.array(registrationProcessSchema).min(1),
  pendingRequests: z.array(processRequestSchema).min(1),
  recentlyCreatedProcesses: z.array(registrationProcessSchema).min(1),
});
export type OperationsDashboard = z.infer<typeof operationsDashboardSchema>;

export const operationsWorkspaceSchema = z.object({
  suppliers: z.array(registrationSupplierSchema),
  developments: z.array(developmentSchema),
  buyers: z.array(buyerSchema),
  processes: z.array(registrationProcessSchema),
  requests: z.array(processRequestSchema),
  tasks: z.array(processTaskSchema),
  documents: z.array(processDocumentSchema),
  requirements: z.array(processRequirementSchema),
});
export type OperationsWorkspace = z.infer<typeof operationsWorkspaceSchema>;
