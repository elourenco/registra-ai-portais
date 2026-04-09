import { apiRequest } from "@/shared/api/http-client";
import { isRecord, pickText } from "@/shared/utils/api-normalizers";

export type ApiProcessRequestTarget = "supplier" | "buyer" | "backoffice" | "registry_office";
export type ApiProcessRequestStatus = "pending" | "completed" | "cancelled";
export type ApiProcessRequestType = "documentation" | "approval" | "payment" | "registry";

export type ApiProcessTaskStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type ApiProcessTaskType = "follow_up" | "document_review" | "registry_contact" | "internal";

export type ApiProcessRequirementStatus = "open" | "in_progress" | "resolved" | "dismissed";

export interface ApiProcessRequest {
  id: string;
  processId: string;
  target: ApiProcessRequestTarget;
  title: string;
  type: ApiProcessRequestType;
  description: string;
  requiredDocuments: string[];
  deadline: string | null;
  status: ApiProcessRequestStatus;
}

export interface ApiProcessTask {
  id: string;
  processId: string;
  title: string;
  description: string;
  assignee: string;
  type: ApiProcessTaskType;
  dueAt: string | null;
  status: ApiProcessTaskStatus;
}

export interface ApiProcessRequirement {
  id: string;
  processId: string;
  title: string;
  description: string;
  status: ApiProcessRequirementStatus;
  supplierActionRequired: boolean;
  createdAt: string | null;
}

export interface ApiProcessOperationalDetail {
  requests: ApiProcessRequest[];
  tasks: ApiProcessTask[];
  requirements: ApiProcessRequirement[];
}

const requestTargets: ApiProcessRequestTarget[] = [
  "supplier",
  "buyer",
  "backoffice",
  "registry_office",
];
const requestStatuses: ApiProcessRequestStatus[] = ["pending", "completed", "cancelled"];
const requestTypes: ApiProcessRequestType[] = ["documentation", "approval", "payment", "registry"];
const taskStatuses: ApiProcessTaskStatus[] = ["pending", "in_progress", "completed", "cancelled"];
const taskTypes: ApiProcessTaskType[] = ["follow_up", "document_review", "registry_contact", "internal"];
const requirementStatuses: ApiProcessRequirementStatus[] = ["open", "in_progress", "resolved", "dismissed"];

function normalizeEnumValue<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  const raw = pickText(value)?.toLowerCase();
  if (!raw) {
    return fallback;
  }

  return allowed.find((item) => item === raw) ?? fallback;
}

function pickItems(response: unknown): unknown[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (!isRecord(response)) {
    return [];
  }

  if (Array.isArray(response.items)) {
    return response.items;
  }

  if (Array.isArray(response.data)) {
    return response.data;
  }

  if (isRecord(response.data) && Array.isArray(response.data.items)) {
    return response.data.items;
  }

  return [];
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => pickText(item))
    .filter((item): item is string => Boolean(item));
}

function normalizeRequest(item: unknown, index: number): ApiProcessRequest {
  const payload = isRecord(item) ? item : {};

  return {
    id: pickText(payload.id, payload.requestId) ?? `request-${index}`,
    processId: pickText(payload.processId) ?? "",
    target: normalizeEnumValue(payload.target, requestTargets, "buyer"),
    title: pickText(payload.title, payload.name) ?? "Solicitação sem título",
    type: normalizeEnumValue(payload.type, requestTypes, "documentation"),
    description: pickText(payload.description, payload.notes) ?? "Sem descrição.",
    requiredDocuments: normalizeStringArray(payload.requiredDocuments),
    deadline: pickText(payload.deadline, payload.dueAt, payload.expiresAt),
    status: normalizeEnumValue(payload.status, requestStatuses, "pending"),
  };
}

function normalizeTask(item: unknown, index: number): ApiProcessTask {
  const payload = isRecord(item) ? item : {};

  return {
    id: pickText(payload.id, payload.taskId) ?? `task-${index}`,
    processId: pickText(payload.processId) ?? "",
    title: pickText(payload.title, payload.name) ?? "Tarefa sem título",
    description: pickText(payload.description, payload.notes) ?? "Sem descrição.",
    assignee: pickText(payload.assignee, payload.owner, payload.responsible) ?? "Não definido",
    type: normalizeEnumValue(payload.type, taskTypes, "internal"),
    dueAt: pickText(payload.dueAt, payload.deadline),
    status: normalizeEnumValue(payload.status, taskStatuses, "pending"),
  };
}

function normalizeRequirement(item: unknown, index: number): ApiProcessRequirement {
  const payload = isRecord(item) ? item : {};

  return {
    id: pickText(payload.id, payload.requirementId) ?? `requirement-${index}`,
    processId: pickText(payload.processId) ?? "",
    title: pickText(payload.title, payload.name) ?? "Exigência sem título",
    description: pickText(payload.description, payload.notes) ?? "Sem descrição.",
    status: normalizeEnumValue(payload.status, requirementStatuses, "open"),
    supplierActionRequired:
      Boolean(payload.supplierActionRequired) ||
      normalizeEnumValue(payload.target, requestTargets, "backoffice") === "supplier",
    createdAt: pickText(payload.createdAt, payload.updatedAt),
  };
}

async function listByProcessId(
  token: string,
  path: string,
  processId: string,
): Promise<unknown[]> {
  const searchParams = new URLSearchParams({
    processId,
    page: "1",
    limit: "100",
  });

  const response = await apiRequest<unknown>(`${path}?${searchParams.toString()}`, {
    token,
    method: "GET",
  });

  return pickItems(response);
}

export async function getProcessOperationalDetail(params: {
  token: string;
  processId: string;
}): Promise<ApiProcessOperationalDetail> {
  const [requestsResponse, tasksResponse, requirementsResponse] = await Promise.all([
    listByProcessId(params.token, "/api/v1/requests", params.processId),
    listByProcessId(params.token, "/api/v1/tasks", params.processId),
    listByProcessId(params.token, "/api/v1/requirements", params.processId),
  ]);

  return {
    requests: requestsResponse.map(normalizeRequest),
    tasks: tasksResponse.map(normalizeTask),
    requirements: requirementsResponse.map(normalizeRequirement),
  };
}