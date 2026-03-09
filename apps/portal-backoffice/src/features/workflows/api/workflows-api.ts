import {
  createWorkflowRuleSchema,
  createWorkflowSchema,
  createWorkflowStepSchema,
  type CreateWorkflowInput,
  type CreateWorkflowRuleInput,
  type CreateWorkflowStepInput,
  type WorkflowCatalog,
} from "@registra/shared";

import {
  normalizeWorkflowCatalog,
  pickWorkflowSummaries,
  toPositiveIntegerId,
  toWorkflow,
} from "@/features/workflows/core/workflow-response";
import { apiRequest } from "@/shared/api/http-client";

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
      const workflow = toWorkflow(summary);

      if (!workflow.id) {
        return workflow;
      }

      const detailResponse = await apiRequest<unknown>(`/api/v1/workflows/${workflow.id}`, {
        token,
        method: "GET",
      });

      return toWorkflow(detailResponse);
    }),
  );

  return normalizeWorkflowCatalog(detailed);
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

export interface DeleteWorkflowStepParams extends WorkflowAuthParams {
  stepId: string;
}

export async function deleteWorkflowStep({
  token,
  stepId,
}: DeleteWorkflowStepParams): Promise<void> {
  await apiRequest<unknown>(`/api/v1/workflows/stages/${stepId}`, {
    token,
    method: "DELETE",
  });
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
