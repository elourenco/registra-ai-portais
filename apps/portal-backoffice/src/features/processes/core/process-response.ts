import {
  processDetailSchema,
  processListItemSchema,
  processListResultSchema,
  type ProcessDetail,
  type ProcessListItem,
  type ProcessListStatus,
} from "@/features/processes/core/process-schema";
import { isRecord, pickBoolean, pickNumber, pickText } from "@/shared/utils/api-normalizers";

function toProcessStatus(value: unknown): ProcessListStatus {
  if (typeof value !== "string") {
    return "in_progress";
  }

  switch (value.trim().toLowerCase()) {
    case "completed":
    case "done":
      return "completed";
    case "cancelled":
    case "canceled":
    case "blocked":
      return "cancelled";
    default:
      return "in_progress";
  }
}

function pickProcessPayload(response: unknown): Record<string, unknown> {
  if (!isRecord(response)) {
    return {};
  }

  for (const key of ["data", "item", "process", "detail"]) {
    if (isRecord(response[key])) {
      return response[key];
    }
  }

  return response;
}

function buildWorkflowName(payload: Record<string, unknown>): string | null {
  if (isRecord(payload.workflow)) {
    return pickText(payload.workflow.name, payload.workflow.title);
  }

  const workflowId = pickText(payload.workflowId);
  return workflowId ? `Workflow #${workflowId}` : null;
}

function buildCurrentStageName(payload: Record<string, unknown>): string | null {
  if (isRecord(payload.currentStage)) {
    return pickText(payload.currentStage.name, payload.currentStage.title);
  }

  if (Array.isArray(payload.stages)) {
    const activeStage = payload.stages.find(
      (stage) => isRecord(stage) && pickText(stage.status) === "in_progress",
    );

    if (isRecord(activeStage)) {
      return pickText(activeStage.name, activeStage.title);
    }
  }

  const currentStageId = pickText(payload.currentStageId);
  return currentStageId ? `Etapa #${currentStageId}` : null;
}

function pickSupplierDisplayName(payload: Record<string, unknown>): string | null {
  if (isRecord(payload.supplier)) {
    return pickText(
      payload.supplier.legalName,
      payload.supplier.tradeName,
      payload.supplier.companyName,
      payload.supplier.razaoSocial,
      payload.supplier.name,
    );
  }

  return pickText(
    payload.supplierName,
    payload.clientName,
    payload.customerName,
    payload.companyName,
    payload.legalName,
    payload.razaoSocial,
  );
}

function normalizeProcessRule(rule: unknown) {
  const payload = isRecord(rule) ? rule : {};

  return {
    id: pickText(payload.id) ?? "",
    name: pickText(payload.name, payload.title) ?? "",
    status: pickText(payload.status) === "completed" ? "completed" : "pending",
    completedAt: pickText(payload.completedAt),
    evidence: pickText(payload.evidence),
  };
}

function normalizeProcessStage(stage: unknown) {
  const payload = isRecord(stage) ? stage : {};

  return {
    id: pickText(payload.id) ?? "",
    workflowId: pickText(payload.workflowId) ?? "",
    name: pickText(payload.name, payload.title) ?? "",
    description: pickText(payload.description),
    order: pickNumber(1, payload.order),
    status:
      pickText(payload.status) === "completed"
        ? "completed"
        : pickText(payload.status) === "in_progress"
          ? "in_progress"
          : "pending",
    rules: Array.isArray(payload.rules) ? payload.rules.map(normalizeProcessRule) : [],
  };
}

export function resolveProcessesListPath(supplierId?: string, status?: string): string {
  const endpoint = import.meta.env.VITE_BACKOFFICE_PROCESSES_ENDPOINT ?? "/api/v1/backoffice/processes";

  const [path, queryString = ""] = endpoint.split("?");
  const searchParams = new URLSearchParams(queryString);

  if (status) {
    searchParams.set("status", status);
  } else {
    searchParams.delete("status");
  }

  if (supplierId) {
    searchParams.set("supplierCompanyId", supplierId);
  } else {
    searchParams.delete("supplierCompanyId");
  }

  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

export function resolveProcessDetailPath(processId: string, supplierId?: string): string {
  const baseEndpoint = supplierId
    ? import.meta.env.VITE_BACKOFFICE_SUPPLIER_PROCESS_DETAIL_ENDPOINT ??
      "/api/v1/workflows/suppliers/{supplierCompanyId}/processes/{processId}"
    : import.meta.env.VITE_BACKOFFICE_PROCESS_DETAIL_ENDPOINT ??
      "/api/v1/workflows/processes/{processId}";

  if (supplierId) {
    return baseEndpoint
      .replace("{supplierCompanyId}", encodeURIComponent(supplierId))
      .replace("{processId}", encodeURIComponent(processId));
  }

  if (baseEndpoint.includes("{processId}")) {
    return baseEndpoint.replace("{processId}", encodeURIComponent(processId));
  }

  return `${baseEndpoint.replace(/\/$/, "")}/${encodeURIComponent(processId)}`;
}

export function pickProcessItems(response: unknown): unknown[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (!isRecord(response)) {
    return [];
  }

  for (const key of ["items", "data", "results", "processes", "processInstances"]) {
    if (Array.isArray(response[key])) {
      return response[key];
    }
  }

  if (isRecord(response.data)) {
    for (const key of ["items", "results", "processes", "processInstances"]) {
      if (Array.isArray(response.data[key])) {
        return response.data[key];
      }
    }
  }

  return [];
}

export function toProcessListItem(value: unknown): ProcessListItem {
  const payload = pickProcessPayload(value);
  const workflowName = buildWorkflowName(payload);
  const currentStageName = buildCurrentStageName(payload);

  return processListItemSchema.parse({
    id: pickText(payload.id) ?? "",
    supplierCompanyId: pickText(
      payload.supplierCompanyId,
      payload.supplierId,
      payload.companyId,
    ) ?? "",
    supplierName: pickSupplierDisplayName(payload),
    developmentId: pickText(payload.developmentId),
    developmentName: pickText(payload.developmentName),
    buyerId: pickText(payload.buyerId),
    buyerName: pickText(payload.buyerName),
    propertyLabel: pickText(payload.propertyLabel, payload.name, payload.title) ?? "",
    registrationNumber: pickText(payload.registrationNumber),
    status: toProcessStatus(payload.status),
    workflowId: pickText(payload.workflowId, isRecord(payload.workflow) ? payload.workflow.id : null),
    workflowName,
    currentStageId: pickText(payload.currentStageId),
    currentStageName,
    pendingRequirements: pickNumber(0, payload.pendingRequirements),
    waitingOn: pickText(payload.waitingOn) ?? null,
    createdAt: pickText(payload.createdAt) ?? "",
    updatedAt: pickText(payload.updatedAt, payload.createdAt) ?? "",
    dueAt: pickText(payload.dueAt),
  });
}

export function toProcessDetail(response: unknown): ProcessDetail {
  const payload = pickProcessPayload(response);
  const workflow = isRecord(payload.workflow)
    ? {
        id: pickText(payload.workflow.id) ?? "",
        name: pickText(payload.workflow.name, payload.workflow.title) ?? "",
      }
    : pickText(payload.workflowId)
      ? {
          id: pickText(payload.workflowId) ?? "",
          name: buildWorkflowName(payload) ?? `Workflow #${pickText(payload.workflowId)}`,
        }
      : null;

  const stages = Array.isArray(payload.stages) ? payload.stages.map(normalizeProcessStage) : [];
  const id = pickText(payload.id) ?? "";
  const name = pickText(payload.name, payload.propertyLabel, payload.title) ?? `Processo #${id}`;
  const supplierCompanyId = pickText(
    payload.supplierCompanyId,
    payload.supplierId,
    payload.companyId,
  ) ?? "";
  const workflowId = pickText(payload.workflowId, isRecord(payload.workflow) ? payload.workflow.id : null);
  const workflowName = buildWorkflowName(payload);
  const currentStageId = pickText(payload.currentStageId);
  const currentStageName = buildCurrentStageName(payload);

  return processDetailSchema.parse({
    id,
    supplierCompanyId,
    supplierName: pickSupplierDisplayName(payload),
    developmentId: pickText(payload.developmentId),
    developmentName: pickText(payload.developmentName),
    buyerId: pickText(payload.buyerId),
    buyerName: pickText(payload.buyerName),
    propertyLabel: pickText(payload.propertyLabel, payload.name, payload.title) ?? name,
    registrationNumber: pickText(payload.registrationNumber),
    status: toProcessStatus(payload.status),
    workflowId,
    workflowName,
    currentStageId,
    currentStageName,
    pendingRequirements: pickNumber(0, payload.pendingRequirements),
    waitingOn: pickText(payload.waitingOn) ?? null,
    createdAt: pickText(payload.createdAt) ?? "",
    updatedAt: pickText(payload.updatedAt, payload.createdAt) ?? "",
    dueAt: pickText(payload.dueAt),
    name,
    workflow,
    stages,
  });
}

export function toProcessListResult(response: unknown, requestedPage: number, requestedLimit: number) {
  const items = pickProcessItems(response).map(toProcessListItem);
  const paginationSource = isRecord(response)
    ? isRecord(response.pagination)
      ? response.pagination
      : isRecord(response.meta)
        ? response.meta
        : response
    : null;

  return processListResultSchema.parse({
    items,
    pagination: {
      page: Math.max(1, pickNumber(requestedPage, paginationSource?.page)),
      limit: Math.max(1, pickNumber(requestedLimit, paginationSource?.limit, paginationSource?.pageSize)),
      totalItems: Math.max(0, pickNumber(items.length, paginationSource?.totalItems, paginationSource?.total, paginationSource?.count)),
      totalPages: Math.max(
        1,
        pickNumber(
          Math.ceil((pickNumber(items.length, paginationSource?.totalItems, paginationSource?.total, paginationSource?.count) || items.length) / Math.max(1, pickNumber(requestedLimit, paginationSource?.limit, paginationSource?.pageSize))),
          paginationSource?.totalPages,
        ),
      ),
      hasNextPage: pickBoolean(paginationSource?.hasNextPage) ?? false,
      hasPreviousPage: pickBoolean(paginationSource?.hasPreviousPage) ?? false,
    },
  });
}
