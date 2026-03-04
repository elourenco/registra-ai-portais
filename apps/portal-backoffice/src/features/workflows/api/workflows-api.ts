import {
  createWorkflowRuleSchema,
  createWorkflowSchema,
  createWorkflowStepSchema,
  ensureSingleDefaultWorkflow,
  workflowCatalogSchema,
  type CreateWorkflowInput,
  type CreateWorkflowRuleInput,
  type CreateWorkflowStepInput,
  type Workflow,
  type WorkflowCatalog,
  type WorkflowRule,
  type WorkflowRuleType,
  type WorkflowStep,
} from "@registra/shared";

import { apiRequest } from "@/shared/api/http-client";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function pickText(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(Math.trunc(value));
    }
  }

  return null;
}

function pickNumber(fallback: number, ...values: unknown[]): number {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return Math.trunc(value);
    }

    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return Math.trunc(parsed);
      }
    }
  }

  return fallback;
}

function pickBoolean(...values: unknown[]): boolean | null {
  for (const value of values) {
    if (typeof value === "boolean") {
      return value;
    }
  }

  return null;
}

function toWorkflowRuleType(value: unknown): WorkflowRuleType {
  switch (value) {
    case "form_fill":
    case "document_upload":
    case "fee_payment":
    case "manual_review":
      return value;
    case "manual_approval":
      return "manual_review";
    default:
      return "manual_review";
  }
}

function toWorkflowRule(raw: unknown, index: number): WorkflowRule {
  const item = isRecord(raw) ? raw : {};

  return {
    id: pickText(item.id) ?? `rule-${index}`,
    title: pickText(item.title) ?? "Regra sem título",
    type: toWorkflowRuleType(item.type),
    guidance: pickText(item.description) ?? "",
    required: pickBoolean(item.isRequired, item.required) ?? true,
  };
}

function toWorkflowStep(raw: unknown, index: number): WorkflowStep {
  const item = isRecord(raw) ? raw : {};
  const rawRules = Array.isArray(item.rules) ? item.rules : [];

  const rules = rawRules
    .map(toWorkflowRule)
    .sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));

  return {
    id: pickText(item.id) ?? `step-${index}`,
    title: pickText(item.name, item.title) ?? "Etapa sem título",
    description: pickText(item.description) ?? "",
    order: Math.max(1, pickNumber(index + 1, item.order)),
    rules,
  };
}

function toWorkflow(detail: unknown): Workflow {
  const item = isRecord(detail) ? detail : {};
  const rawSteps = Array.isArray(item.stages) ? item.stages : [];

  const steps = rawSteps.map(toWorkflowStep).sort((a, b) => a.order - b.order);

  return {
    id: pickText(item.id) ?? "",
    name: pickText(item.name) ?? "Workflow sem nome",
    description: pickText(item.description) ?? "",
    isDefault: pickBoolean(item.isDefault) ?? false,
    createdAt: pickText(item.createdAt) ?? new Date().toISOString(),
    updatedAt: pickText(item.updatedAt) ?? new Date().toISOString(),
    steps,
  };
}

function pickWorkflowSummaries(response: unknown): unknown[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (!isRecord(response)) {
    return [];
  }

  if (Array.isArray(response.items)) {
    return response.items;
  }

  return [];
}

function toPositiveIntegerId(value: string, fieldName: string): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} inválido para a API: ${value}`);
  }

  return parsed;
}

export interface WorkflowAuthParams {
  token: string;
}

export async function listWorkflows({ token }: WorkflowAuthParams): Promise<WorkflowCatalog> {
  const summariesResponse = await apiRequest<unknown>("/api/v1/workflows", {
    token,
    method: "GET",
  });

  const summaries = pickWorkflowSummaries(summariesResponse);

  const detailed = await Promise.all(
    summaries.map(async (summary) => {
      const summaryRecord = isRecord(summary) ? summary : {};
      const workflowId = pickText(summaryRecord.id);

      if (!workflowId) {
        return toWorkflow(summaryRecord);
      }

      const detailResponse = await apiRequest<unknown>(`/api/v1/workflows/${workflowId}`, {
        token,
        method: "GET",
      });

      return toWorkflow(detailResponse);
    }),
  );

  const normalized = ensureSingleDefaultWorkflow(workflowCatalogSchema.parse(detailed));
  return normalized;
}

export interface CreateWorkflowParams extends WorkflowAuthParams {
  input: CreateWorkflowInput;
}

export async function createWorkflow({
  token,
  input,
}: CreateWorkflowParams): Promise<WorkflowCatalog> {
  const payload = createWorkflowSchema.parse(input);

  await apiRequest<unknown>("/api/v1/workflows", {
    token,
    method: "POST",
    body: JSON.stringify({
      name: payload.name,
      description: payload.description || undefined,
      isDefault: false,
    }),
  });

  return listWorkflows({ token });
}

export interface SetDefaultWorkflowParams extends WorkflowAuthParams {
  workflowId: string;
}

export async function setDefaultWorkflow({
  token,
  workflowId,
}: SetDefaultWorkflowParams): Promise<WorkflowCatalog> {
  await apiRequest<unknown>(`/api/v1/workflows/${workflowId}/default`, {
    token,
    method: "PATCH",
    body: JSON.stringify({}),
  });

  return listWorkflows({ token });
}

export interface DeleteWorkflowParams extends WorkflowAuthParams {
  workflowId: string;
}

export async function deleteWorkflow({ token, workflowId }: DeleteWorkflowParams): Promise<void> {
  await apiRequest<unknown>(`/api/v1/workflows/${workflowId}`, {
    token,
    method: "DELETE",
  });
}

export interface AddWorkflowStepParams extends WorkflowAuthParams {
  input: CreateWorkflowStepInput;
}

export async function addWorkflowStep({
  token,
  input,
}: AddWorkflowStepParams): Promise<WorkflowCatalog> {
  const payload = createWorkflowStepSchema.parse(input);
  const workflows = await listWorkflows({ token });

  const currentWorkflow = workflows.find((workflow) => workflow.id === payload.workflowId);
  const nextOrder = (currentWorkflow?.steps.length ?? 0) + 1;

  await apiRequest<unknown>(`/api/v1/workflows/${payload.workflowId}/stages`, {
    token,
    method: "POST",
    body: JSON.stringify({
      name: payload.title,
      description: payload.description || undefined,
      order: nextOrder,
    }),
  });

  return listWorkflows({ token });
}

export interface AddWorkflowRuleParams extends WorkflowAuthParams {
  input: CreateWorkflowRuleInput;
}

export async function addWorkflowRule({
  token,
  input,
}: AddWorkflowRuleParams): Promise<WorkflowCatalog> {
  const payload = createWorkflowRuleSchema.parse(input);
  const workflows = await listWorkflows({ token });

  const currentWorkflow = workflows.find((workflow) => workflow.id === payload.workflowId);
  const currentStep = currentWorkflow?.steps.find((step) => step.id === payload.stepId);
  const nextOrder = (currentStep?.rules.length ?? 0) + 1;

  await apiRequest<unknown>(`/api/v1/workflows/stages/${payload.stepId}/rules`, {
    token,
    method: "POST",
    body: JSON.stringify({
      type: payload.type,
      title: payload.title,
      description: payload.guidance || undefined,
      order: nextOrder,
      isRequired: payload.required,
    }),
  });

  return listWorkflows({ token });
}

export interface UpsertSupplierWorkflowAssignmentInput extends WorkflowAuthParams {
  supplierCompanyId: string;
  workflowId: string;
}

export async function upsertSupplierWorkflowAssignment({
  token,
  supplierCompanyId,
  workflowId,
}: UpsertSupplierWorkflowAssignmentInput): Promise<void> {
  await apiRequest<unknown>(`/api/v1/supplier/companies/${supplierCompanyId}/workflow`, {
    token,
    method: "PATCH",
    body: JSON.stringify({
      workflowId: toPositiveIntegerId(workflowId, "workflowId"),
    }),
  });
}
