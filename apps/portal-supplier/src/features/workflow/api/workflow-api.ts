import { type WorkflowRuleType } from "@registra/shared";

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

export type SupplierProcessStatus = "in_progress" | "completed" | "cancelled";
export type SupplierStageStatus = "pending" | "in_progress" | "completed";
export type SupplierRuleStatus = "pending" | "completed";

export interface SupplierProcessRuleView {
  id: string;
  title: string;
  type: WorkflowRuleType;
  guidance: string;
  required: boolean;
  order: number;
  status: SupplierRuleStatus;
}

export interface SupplierProcessStepView {
  id: string;
  title: string;
  description: string;
  order: number;
  status: SupplierStageStatus;
  rules: SupplierProcessRuleView[];
}

export interface SupplierWorkflowProcess {
  processId: string;
  processName: string;
  processStatus: SupplierProcessStatus;
  workflowId: string;
  workflowName: string;
  steps: SupplierProcessStepView[];
}

function toRule(raw: unknown, index: number): SupplierProcessRuleView {
  const item = isRecord(raw) ? raw : {};

  return {
    id: pickText(item.id) ?? `rule-${index}`,
    title: pickText(item.title) ?? "Regra sem título",
    type: toWorkflowRuleType(item.type),
    guidance: pickText(item.description, item.evidence) ?? "",
    required: item.isRequired !== false,
    order: Math.max(1, pickNumber(index + 1, item.order)),
    status: pickText(item.status) === "completed" ? "completed" : "pending",
  };
}

function toStep(raw: unknown, index: number): SupplierProcessStepView {
  const item = isRecord(raw) ? raw : {};
  const rawRules = Array.isArray(item.rules) ? item.rules : [];

  return {
    id: pickText(item.id) ?? `step-${index}`,
    title: pickText(item.name, item.title) ?? "Etapa sem título",
    description: pickText(item.description) ?? "",
    order: Math.max(1, pickNumber(index + 1, item.order)),
    status: (() => {
      const status = pickText(item.status);
      if (status === "completed") {
        return "completed";
      }
      if (status === "in_progress") {
        return "in_progress";
      }
      return "pending";
    })(),
    rules: rawRules.map(toRule).sort((a, b) => a.order - b.order),
  };
}

function toSupplierWorkflowProcess(detail: unknown): SupplierWorkflowProcess {
  const item = isRecord(detail) ? detail : {};
  const workflow = isRecord(item.workflow) ? item.workflow : {};
  const stages = Array.isArray(item.stages) ? item.stages : [];

  return {
    processId: pickText(item.id) ?? "",
    processName: pickText(item.name) ?? "Processo sem nome",
    processStatus: (() => {
      const status = pickText(item.status);
      if (status === "completed") {
        return "completed";
      }
      if (status === "cancelled") {
        return "cancelled";
      }
      return "in_progress";
    })(),
    workflowId: pickText(workflow.id, item.workflowId) ?? "",
    workflowName: pickText(workflow.name) ?? "Workflow atual",
    steps: stages.map(toStep).sort((a, b) => a.order - b.order),
  };
}

function pickProcessItems(response: unknown): unknown[] {
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

function pickInProgressProcessId(response: unknown): string | null {
  const items = pickProcessItems(response)
    .map((item) => (isRecord(item) ? item : {}))
    .filter((item) => pickText(item.status) === "in_progress")
    .sort((a, b) => {
      const left = Date.parse(pickText(a.updatedAt, a.createdAt) ?? "");
      const right = Date.parse(pickText(b.updatedAt, b.createdAt) ?? "");
      return (Number.isNaN(right) ? 0 : right) - (Number.isNaN(left) ? 0 : left);
    });

  return items.length > 0 ? pickText(items[0].id) : null;
}

function buildDefaultProcessName(nameHint: string): string {
  const baseName = nameHint.trim();
  if (baseName.length >= 3) {
    return baseName;
  }

  const stamp = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date());

  return `Processo de onboarding ${stamp}`;
}

export interface SupplierWorkflowAuthParams {
  token: string;
}

export interface GetSupplierWorkflowProcessInput extends SupplierWorkflowAuthParams {
  processNameHint?: string;
}

export async function getSupplierWorkflowProcess({
  token,
  processNameHint,
}: GetSupplierWorkflowProcessInput): Promise<SupplierWorkflowProcess> {
  const processesResponse = await apiRequest<unknown>("/api/v1/workflows/processes", {
    token,
    method: "GET",
  });

  const currentProcessId = pickInProgressProcessId(processesResponse);

  if (currentProcessId) {
    const detail = await apiRequest<unknown>(`/api/v1/workflows/processes/${currentProcessId}`, {
      token,
      method: "GET",
    });

    return toSupplierWorkflowProcess(detail);
  }

  const created = await apiRequest<unknown>("/api/v1/workflows/processes", {
    token,
    method: "POST",
    body: JSON.stringify({
      name: buildDefaultProcessName(processNameHint ?? ""),
    }),
  });

  return toSupplierWorkflowProcess(created);
}

export interface CompleteSupplierRuleInput extends SupplierWorkflowAuthParams {
  processId: string;
  ruleId: string;
  evidence?: string;
}

export async function completeSupplierRule({
  token,
  processId,
  ruleId,
  evidence,
}: CompleteSupplierRuleInput): Promise<SupplierWorkflowProcess> {
  const detail = await apiRequest<unknown>(
    `/api/v1/workflows/processes/${processId}/rules/${ruleId}/complete`,
    {
      token,
      method: "POST",
      body: JSON.stringify({
        evidence: evidence?.trim() || undefined,
      }),
    },
  );

  return toSupplierWorkflowProcess(detail);
}
