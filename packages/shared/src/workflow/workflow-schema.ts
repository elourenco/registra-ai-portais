import { z } from "zod";

export const workflowRuleTypeSchema = z.enum([
  "form_fill",
  "document_upload",
  "fee_payment",
  "manual_review",
]);

export type WorkflowRuleType = z.infer<typeof workflowRuleTypeSchema>;

export const workflowRuleSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(3).max(90),
  type: workflowRuleTypeSchema,
  guidance: z.string().trim().max(240).optional().default(""),
  required: z.boolean().default(true),
});

export const workflowStepSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(3).max(90),
  description: z.string().trim().max(240).optional().default(""),
  order: z.number().int().positive(),
  isActive: z.boolean().default(true),
  rules: z.array(workflowRuleSchema),
});

export const workflowSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(3).max(90),
  description: z.string().trim().max(240).optional().default(""),
  isDefault: z.boolean(),
  steps: z.array(workflowStepSchema),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const workflowCatalogSchema = z.array(workflowSchema);

export type WorkflowRule = z.infer<typeof workflowRuleSchema>;
export type WorkflowStep = z.infer<typeof workflowStepSchema>;
export type Workflow = z.infer<typeof workflowSchema>;
export type WorkflowCatalog = z.infer<typeof workflowCatalogSchema>;

export const createWorkflowSchema = z.object({
  name: z.string().trim().min(3, "Informe um nome com pelo menos 3 caracteres").max(90),
  description: z.string().trim().max(240).optional().default(""),
});

export type CreateWorkflowInput = z.input<typeof createWorkflowSchema>;
export type CreateWorkflowPayload = z.output<typeof createWorkflowSchema>;

export const createWorkflowStepSchema = z.object({
  workflowId: z.string().trim().min(1),
  title: z.string().trim().min(3, "Informe o título da etapa").max(90),
  description: z.string().trim().max(240).optional().default(""),
});

export type CreateWorkflowStepInput = z.input<typeof createWorkflowStepSchema>;
export type CreateWorkflowStepPayload = z.output<typeof createWorkflowStepSchema>;

export const updateWorkflowStepSchema = z.object({
  title: z.string().trim().min(3, "Informe o título da etapa").max(90),
  description: z.string().trim().max(240).optional().default(""),
  isActive: z.boolean(),
});

export type UpdateWorkflowStepInput = z.input<typeof updateWorkflowStepSchema>;
export type UpdateWorkflowStepPayload = z.output<typeof updateWorkflowStepSchema>;

export const createWorkflowRuleSchema = z.object({
  workflowId: z.string().trim().min(1),
  stepId: z.string().trim().min(1),
  title: z.string().trim().min(3, "Informe o título da regra").max(90),
  type: workflowRuleTypeSchema,
  guidance: z.string().trim().max(240).optional().default(""),
  required: z.boolean().default(true),
});

export type CreateWorkflowRuleInput = z.input<typeof createWorkflowRuleSchema>;
export type CreateWorkflowRulePayload = z.output<typeof createWorkflowRuleSchema>;

export const supplierWorkflowAssignmentSchema = z.object({
  supplierKey: z.string().trim().min(3),
  workflowId: z.string().trim().min(1),
  updatedAt: z.string().min(1),
});

export type SupplierWorkflowAssignment = z.infer<typeof supplierWorkflowAssignmentSchema>;

export const supplierWorkflowAssignmentsSchema = z.array(supplierWorkflowAssignmentSchema);

export const supplierRuleCompletionSchema = z.object({
  supplierKey: z.string().trim().min(3),
  workflowId: z.string().trim().min(1),
  stepId: z.string().trim().min(1),
  ruleId: z.string().trim().min(1),
  done: z.boolean(),
  updatedAt: z.string().min(1),
});

export type SupplierRuleCompletion = z.infer<typeof supplierRuleCompletionSchema>;

export const supplierRuleCompletionsSchema = z.array(supplierRuleCompletionSchema);

export const workflowRuleTypeLabels: Record<WorkflowRuleType, string> = {
  form_fill: "Preenchimento de formulário",
  document_upload: "Envio de documento",
  fee_payment: "Pagamento de taxa",
  manual_review: "Revisão manual",
};
