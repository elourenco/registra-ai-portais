import { z } from "zod";

export const buyerProcessMaritalStatusSchema = z.enum([
  "single",
  "married",
  "stable_union",
]);

export const buyerProcessDocumentStatusSchema = z.enum([
  "pending",
  "uploaded",
  "under_review",
  "approved",
  "rejected",
  "replaced",
]);

export const buyerProcessTrackerStatusSchema = z.enum([
  "in_progress",
  "in_review",
  "waiting_user",
  "completed",
]);

export const buyerProcessApiStatusSchema = z.enum([
  "pending",
  "active",
  "completed",
  "inactive",
]);

export const buyerDevelopmentApiStatusSchema = z.enum([
  "drafting",
  "commercialization",
  "registry",
  "completed",
]);

export const buyerProcessTimelineStageSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  status: z.enum(["pending", "in_progress", "completed"]),
  description: z.string(),
});

export const buyerDevelopmentAddressApiSchema = z.object({
  postalCode: z.string(),
  address: z.string(),
  number: z.string(),
  complement: z.string().nullable(),
  neighborhood: z.string(),
  city: z.string(),
  state: z.string(),
});

export const buyerProcessPropertySchema = z.object({
  name: z.string(),
  cnpj: z.string(),
  address: z.string(),
  unitLabel: z.string(),
  acquisitionType: z.string(),
  purchaseValue: z.string(),
});

export const buyerProcessApiBuyerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  cpf: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  basicDataConfirmed: z.boolean(),
  basicDataConfirmedAt: z.string().nullable(),
  accessKey: z.string().nullable(),
  processId: z.string().min(1),
  maritalStatus: buyerProcessMaritalStatusSchema.nullable(),
  hasEnotariadoCertificate: z.boolean().nullable(),
  spouseName: z.string().nullable(),
  spouseCpf: z.string().nullable(),
  spouseBirthDate: z.string().nullable(),
  spouseEmail: z.string().nullable(),
  spousePhone: z.string().nullable(),
  nationality: z.string().nullable(),
  profession: z.string().nullable(),
  birthDate: z.string().nullable(),
  unitLabel: z.string().nullable(),
  availabilityItemId: z.string().nullable(),
  acquisitionType: z.string().nullable(),
  purchaseValue: z.number().nullable(),
  contractDate: z.string().nullable(),
  notes: z.string().nullable(),
  status: buyerProcessApiStatusSchema,
});

export const buyerProcessApiDevelopmentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  cnpj: z.string().min(1),
  status: buyerDevelopmentApiStatusSchema,
  address: buyerDevelopmentAddressApiSchema,
});

export const buyerProcessStageDocumentSummaryApiSchema = z.object({
  stageId: z.string().min(1),
  stageName: z.string().min(1),
  hasUploadedDocuments: z.boolean(),
  uploadedDocumentsCount: z.number().int().min(0),
  lastUploadedAt: z.string().nullable(),
});

export const buyerProcessApiSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  status: z.enum(["in_progress", "completed", "cancelled"]),
  stageId: z.string().nullable(),
  stageName: z.string().nullable(),
  currentStageDocumentSummary: buyerProcessStageDocumentSummaryApiSchema.nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const authenticatedBuyerProcessesResponseSchema = z.object({
  buyer: buyerProcessApiBuyerSchema,
  development: buyerProcessApiDevelopmentSchema,
  processes: z.array(buyerProcessApiSummarySchema).catch([]),
  stages: z.array(z.any()).catch([]),
});

export const buyerProcessParticipantSchema = z.object({
  id: z.string().min(1),
  fullName: z.string(),
  documentNumber: z.string(),
  birthDate: z.string().nullable(),
  nationality: z.string().nullable(),
  profession: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
});

export const buyerProcessDocumentSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  type: z.string().nullable().optional(),
  owner: z.enum(["buyer", "spouse", "backoffice"]),
  status: buyerProcessDocumentStatusSchema,
  fileName: z.string().nullable(),
  fileType: z.string().nullable(),
  fileSizeKb: z.number().int().nullable(),
  previewUrl: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  createdAt: z.string().nullable().optional(),
});

export const buyerProcessSnapshotSchema = z.object({
  buyerId: z.string().min(1),
  processId: z.string().min(1),
  identifierType: z.enum(["cpf", "cnpj"]),
  basicDataConfirmed: z.boolean(),
  hasEnotariadoCertificate: z.boolean(),
  property: buyerProcessPropertySchema,
  personalData: buyerProcessParticipantSchema,
  maritalStatus: buyerProcessMaritalStatusSchema,
  spouseData: buyerProcessParticipantSchema.nullable(),
  hasSpouse: z.boolean(),
  documents: z.array(buyerProcessDocumentSchema),
  trackerStatus: buyerProcessTrackerStatusSchema,
  timeline: z.array(buyerProcessTimelineStageSchema),
  submittedAt: z.string().nullable(),
});

export type BuyerProcessMaritalStatus = z.infer<typeof buyerProcessMaritalStatusSchema>;
export type BuyerProcessDocumentStatus = z.infer<typeof buyerProcessDocumentStatusSchema>;
export type BuyerProcessTrackerStatus = z.infer<typeof buyerProcessTrackerStatusSchema>;
export type BuyerProcessApiStatus = z.infer<typeof buyerProcessApiStatusSchema>;
export type BuyerDevelopmentApiStatus = z.infer<typeof buyerDevelopmentApiStatusSchema>;
export type BuyerProcessTimelineStage = z.infer<typeof buyerProcessTimelineStageSchema>;
export type BuyerDevelopmentAddressApi = z.infer<typeof buyerDevelopmentAddressApiSchema>;
export type BuyerProcessProperty = z.infer<typeof buyerProcessPropertySchema>;
export type BuyerProcessApiBuyer = z.infer<typeof buyerProcessApiBuyerSchema>;
export type BuyerProcessApiDevelopment = z.infer<typeof buyerProcessApiDevelopmentSchema>;
export type BuyerProcessStageDocumentSummaryApi = z.infer<
  typeof buyerProcessStageDocumentSummaryApiSchema
>;
export type BuyerProcessApiSummary = z.infer<typeof buyerProcessApiSummarySchema>;
export type AuthenticatedBuyerProcessesResponse = z.infer<
  typeof authenticatedBuyerProcessesResponseSchema
>;
export type BuyerProcessParticipant = z.infer<typeof buyerProcessParticipantSchema>;
export type BuyerProcessDocument = z.infer<typeof buyerProcessDocumentSchema>;
export type BuyerProcessSnapshot = z.infer<typeof buyerProcessSnapshotSchema>;
