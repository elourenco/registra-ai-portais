import {
  ensureSingleDefaultWorkflow,
  workflowCatalogSchema,
  type Workflow,
  type WorkflowCatalog,
  type WorkflowRule,
  type WorkflowRuleType,
  type WorkflowStep,
} from "@registra/shared";

import { isRecord, pickBoolean, pickNumber, pickText } from "@/shared/utils/api-normalizers";

export function toWorkflowRuleType(value: unknown): WorkflowRuleType {
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

export function toWorkflowRule(raw: unknown, index: number): WorkflowRule {
  const item = isRecord(raw) ? raw : {};

  return {
    id: pickText(item.id) ?? `rule-${index}`,
    title: pickText(item.title) ?? "Regra sem título",
    type: toWorkflowRuleType(item.type),
    guidance: pickText(item.description) ?? "",
    required: pickBoolean(item.isRequired, item.required) ?? true,
  };
}

export function toWorkflowStep(raw: unknown, index: number): WorkflowStep {
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
    isActive: pickBoolean(item.isActive) ?? true,
    rules,
  };
}

export function toWorkflow(detail: unknown): Workflow {
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

export function pickWorkflowSummaries(response: unknown): unknown[] {
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

export function normalizeWorkflowCatalog(workflows: Workflow[]): WorkflowCatalog {
  return ensureSingleDefaultWorkflow(workflowCatalogSchema.parse(workflows));
}

export function toPositiveIntegerId(value: string, fieldName: string): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} inválido para a API: ${value}`);
  }

  return parsed;
}
