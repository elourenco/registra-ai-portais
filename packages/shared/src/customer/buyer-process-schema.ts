import { z } from "zod";

export const buyerProcessMaritalStatusSchema = z.enum([
  "single",
  "married",
  "stable_union",
]);

export const buyerProcessDocumentStatusSchema = z.enum([
  "pending",
  "uploaded",
  "approved",
  "rejected",
]);

export const buyerProcessTrackerStatusSchema = z.enum([
  "in_progress",
  "in_review",
  "waiting_user",
  "completed",
]);

export const buyerProcessTimelineStageSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  status: z.enum(["pending", "in_progress", "completed"]),
  description: z.string(),
});

export const buyerProcessPropertySchema = z.object({
  empreendimento: z.string(),
  unidade: z.string(),
  cidade: z.string(),
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
  owner: z.enum(["buyer", "spouse", "backoffice"]),
  status: buyerProcessDocumentStatusSchema,
  fileName: z.string().nullable(),
  fileType: z.string().nullable(),
  fileSizeKb: z.number().int().nullable(),
  previewUrl: z.string().nullable(),
  rejectionReason: z.string().nullable(),
});

export const buyerProcessSnapshotSchema = z.object({
  processId: z.string().min(1),
  identifierType: z.enum(["cpf", "cnpj"]),
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
export type BuyerProcessTimelineStage = z.infer<typeof buyerProcessTimelineStageSchema>;
export type BuyerProcessProperty = z.infer<typeof buyerProcessPropertySchema>;
export type BuyerProcessParticipant = z.infer<typeof buyerProcessParticipantSchema>;
export type BuyerProcessDocument = z.infer<typeof buyerProcessDocumentSchema>;
export type BuyerProcessSnapshot = z.infer<typeof buyerProcessSnapshotSchema>;
